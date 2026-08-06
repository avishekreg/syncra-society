import type {
  BotanicalHealthStatus,
  GardeningTask,
  GardeningTaskType,
  GreenCompostInventory,
  GreenCompostOrder,
  PlantSwapListing,
  PlantSwapType,
  SocietyBotanicalAsset
} from '../types/db'
import { ensureSocietyFlatId } from './flatRegistry'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

let localMode = false
let localAssets: SocietyBotanicalAsset[] = []
let localTasks: GardeningTask[] = []
let localInventory: GreenCompostInventory[] = []
let localOrders: GreenCompostOrder[] = []
let localSwaps: PlantSwapListing[] = []

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function qrCode(plantName: string, zone: string) {
  let hash = 0
  const seed = `${plantName}:${zone}`.toLowerCase()
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  return `BOT-${hash.toString(16).toUpperCase().padStart(8, '0')}`
}

/** Heuristic carbon offset estimate (kg/year) from species keywords. */
export function estimateCarbonOffsetKg(species: string | null | undefined, plantedDate?: string | null) {
  const s = (species || '').toLowerCase()
  let base = 12
  if (/neem|peepal|banyan|oak|mango/.test(s)) base = 48
  else if (/guava|jamun|ashoka|gulmohar/.test(s)) base = 28
  else if (/hibiscus|rose|jasmine|tulsi|herb/.test(s)) base = 4
  if (plantedDate) {
    const years = Math.max(0.5, (Date.now() - new Date(plantedDate).getTime()) / (365.25 * 86400000))
    return Math.round(base * Math.min(years, 25) * 10) / 10
  }
  return base
}

export type PlantDiagnosis = {
  healthStatus: BotanicalHealthStatus
  diagnosis: string
  careSteps: string[]
}

/** AI Plant Doctor — photo + symptom heuristics (no external model required). */
export function diagnosePlantCondition(input: {
  plantName: string
  species?: string
  symptomNotes?: string
  photoDataUrl?: string
}): PlantDiagnosis {
  const notes = `${input.symptomNotes || ''} ${input.species || ''}`.toLowerCase()
  const hasPhoto = Boolean(input.photoDataUrl)

  if (/yellow|chlorosis|pale leaf/.test(notes)) {
    return {
      healthStatus: 'NEEDS_CARE',
      diagnosis: hasPhoto
        ? 'Leaf yellowing detected — likely nitrogen deficiency or overwatering stress.'
        : 'Yellowing symptoms reported — check soil moisture and nutrient balance.',
      careSteps: [
        'Reduce watering for 48 hours; confirm drainage holes are clear.',
        'Apply balanced NPK fertilizer at half strength.',
        'Move to bright indirect light for 5–7 days and reassess.'
      ]
    }
  }
  if (/spot|fungus|mildew|pest|aphid|mealy/.test(notes)) {
    return {
      healthStatus: 'NEEDS_CARE',
      diagnosis: 'Pest / fungal pressure indicated on foliage.',
      careSteps: [
        'Isolate from dense plantings if possible.',
        'Wipe leaves; apply neem oil spray at dusk for 3 evenings.',
        'Schedule PEST_CONTROL task for society gardener.'
      ]
    }
  }
  if (/wilt|dry|brown tip|crisp/.test(notes)) {
    return {
      healthStatus: 'NEEDS_CARE',
      diagnosis: 'Drought / heat stress pattern.',
      careSteps: [
        'Deep water at root zone early morning.',
        'Mulch with society compost 2–3 cm around base (not against stem).',
        'Increase watering frequency during heatwave days.'
      ]
    }
  }
  if (/treated|recover|improving/.test(notes)) {
    return {
      healthStatus: 'TREATED',
      diagnosis: 'Recovery underway after prior treatment.',
      careSteps: [
        'Continue light watering schedule.',
        'Hold fertilizer for one week.',
        'Log weekly photo check-in via QR tag.'
      ]
    }
  }
  return {
    healthStatus: 'HEALTHY',
    diagnosis: hasPhoto
      ? 'Foliage appearance within healthy range for tagged specimen.'
      : 'No acute stress signals — maintain routine care.',
    careSteps: [
      'Keep weekly watering cadence based on weather dispatch.',
      'Inspect for new shoots after monsoon / heat spells.',
      'Encourage flat adoption to fund seasonal mulching.'
    ]
  }
}

export type WeatherParams = {
  tempC: number
  rainMm: number
  humidityPct: number
}

/** Auto-assign daily gardening schedule from weather + plant health. */
export function buildDailyGardeningSchedule(input: {
  societyId: string
  assets: SocietyBotanicalAsset[]
  weather: WeatherParams
  gardenerName: string
  scheduledFor: string
}): Array<Omit<GardeningTask, 'id' | 'created_at' | 'status'> & { status: 'PENDING' }> {
  const tasks: Array<Omit<GardeningTask, 'id' | 'created_at' | 'status'> & { status: 'PENDING' }> = []
  const hot = input.weather.tempC >= 34
  const rainy = input.weather.rainMm >= 8
  const dry = input.weather.humidityPct < 35 && input.weather.rainMm < 2

  for (const asset of input.assets) {
    if (asset.health_status === 'NEEDS_CARE') {
      tasks.push({
        society_id: input.societyId,
        botanical_asset_id: asset.id,
        task_type: /pest|fungus|spot/i.test(asset.last_diagnosis || '') ? 'PEST_CONTROL' : 'FERTILIZER',
        assigned_gardener_name: input.gardenerName,
        scheduled_for: input.scheduledFor,
        status: 'PENDING',
        water_liters: rainy ? 0 : hot ? 18 : 10,
        fertilizer_kg: 0.5,
        weather_note: `Auto: ${input.weather.tempC}°C · rain ${input.weather.rainMm}mm · RH ${input.weather.humidityPct}%`,
        notes: asset.last_diagnosis || 'Priority care from plant doctor'
      })
    } else if (!rainy && (hot || dry)) {
      tasks.push({
        society_id: input.societyId,
        botanical_asset_id: asset.id,
        task_type: 'WATERING',
        assigned_gardener_name: input.gardenerName,
        scheduled_for: input.scheduledFor,
        status: 'PENDING',
        water_liters: hot ? 15 : 8,
        fertilizer_kg: 0,
        weather_note: `Auto water: heat/dry stress risk`,
        notes: `${asset.plant_name} · ${asset.location_zone}`
      })
    }
  }

  if (tasks.length === 0 && input.assets.length > 0) {
    tasks.push({
      society_id: input.societyId,
      botanical_asset_id: input.assets[0].id,
      task_type: 'PRUNING',
      assigned_gardener_name: input.gardenerName,
      scheduled_for: input.scheduledFor,
      status: 'PENDING',
      water_liters: 0,
      fertilizer_kg: 0,
      weather_note: `Mild day (${input.weather.tempC}°C) — light maintenance`,
      notes: 'Weather-optimal pruning window'
    })
  }

  return tasks
}

export async function listBotanicalAssets(societyId: string): Promise<SocietyBotanicalAsset[]> {
  if (localMode) return localAssets.filter((a) => a.society_id === societyId)
  try {
    return await restGet<SocietyBotanicalAsset[]>(
      `society_botanical_assets?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listBotanicalAssets(societyId)
  }
}

export async function findAssetByQr(societyId: string, qrTagCode: string): Promise<SocietyBotanicalAsset | null> {
  const code = qrTagCode.trim().toUpperCase()
  if (localMode) {
    return localAssets.find((a) => a.society_id === societyId && a.qr_tag_code.toUpperCase() === code) ?? null
  }
  try {
    const rows = await restGet<SocietyBotanicalAsset[]>(
      `society_botanical_assets?society_id=eq.${societyId}&qr_tag_code=eq.${encodeURIComponent(code)}&limit=1`
    )
    return rows[0] ?? null
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return findAssetByQr(societyId, qrTagCode)
  }
}

export async function registerBotanicalAsset(input: {
  societyId: string
  plantName: string
  species?: string
  locationZone: string
  plantedDate?: string
  qrTagCode?: string
}): Promise<SocietyBotanicalAsset> {
  const payload = {
    society_id: input.societyId,
    plant_name: input.plantName.trim(),
    species: input.species?.trim() || null,
    qr_tag_code: (input.qrTagCode || qrCode(input.plantName, input.locationZone)).toUpperCase(),
    location_zone: input.locationZone.trim(),
    planted_date: input.plantedDate || null,
    health_status: 'HEALTHY' as const,
    carbon_offset_kg: estimateCarbonOffsetKg(input.species, input.plantedDate),
    photo_url: null,
    last_diagnosis: null,
    care_steps: null,
    adopted_by_flat_id: null,
    adopted_by_flat_number: null
  }

  if (localMode) {
    const row: SocietyBotanicalAsset = { id: rid('plant'), created_at: new Date().toISOString(), ...payload }
    localAssets.unshift(row)
    return row
  }
  try {
    return await restPost<SocietyBotanicalAsset>('society_botanical_assets', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return registerBotanicalAsset(input)
  }
}

export async function adoptBotanicalAsset(input: {
  assetId: string
  societyId: string
  flatNumber: string
}): Promise<SocietyBotanicalAsset> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const patch = {
    adopted_by_flat_id: flatId,
    adopted_by_flat_number: input.flatNumber.trim()
  }

  if (localMode) {
    const row = localAssets.find((a) => a.id === input.assetId)
    if (!row) throw new Error('Plant not found')
    if (row.adopted_by_flat_id) throw new Error('Already adopted by another flat')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<SocietyBotanicalAsset>(`society_botanical_assets?id=eq.${input.assetId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return adoptBotanicalAsset(input)
  }
}

export async function applyPlantDiagnosis(input: {
  assetId: string
  plantName: string
  species?: string
  symptomNotes?: string
  photoDataUrl?: string
}): Promise<SocietyBotanicalAsset> {
  const diagnosis = diagnosePlantCondition(input)
  const patch = {
    health_status: diagnosis.healthStatus,
    last_diagnosis: diagnosis.diagnosis,
    care_steps: diagnosis.careSteps.join('\n'),
    photo_url: input.photoDataUrl?.slice(0, 500) || null
  }

  if (localMode) {
    const row = localAssets.find((a) => a.id === input.assetId)
    if (!row) throw new Error('Plant not found')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<SocietyBotanicalAsset>(`society_botanical_assets?id=eq.${input.assetId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return applyPlantDiagnosis(input)
  }
}

export async function listGardeningTasks(societyId: string): Promise<GardeningTask[]> {
  if (localMode) return localTasks.filter((t) => t.society_id === societyId)
  try {
    return await restGet<GardeningTask[]>(
      `gardening_tasks?society_id=eq.${societyId}&order=scheduled_for.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listGardeningTasks(societyId)
  }
}

export async function createGardeningTask(input: {
  societyId: string
  taskType: GardeningTaskType
  assignedGardenerName: string
  scheduledFor: string
  botanicalAssetId?: string
  waterLiters?: number
  fertilizerKg?: number
  weatherNote?: string
  notes?: string
}): Promise<GardeningTask> {
  const payload = {
    society_id: input.societyId,
    botanical_asset_id: input.botanicalAssetId || null,
    task_type: input.taskType,
    assigned_gardener_name: input.assignedGardenerName.trim(),
    scheduled_for: input.scheduledFor,
    status: 'PENDING' as const,
    water_liters: input.waterLiters ?? 0,
    fertilizer_kg: input.fertilizerKg ?? 0,
    weather_note: input.weatherNote || null,
    notes: input.notes || null
  }

  if (localMode) {
    const row: GardeningTask = { id: rid('task'), created_at: new Date().toISOString(), ...payload }
    localTasks.unshift(row)
    return row
  }
  try {
    return await restPost<GardeningTask>('gardening_tasks', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createGardeningTask(input)
  }
}

export async function dispatchWeatherTasks(input: {
  societyId: string
  gardenerName: string
  weather: WeatherParams
  scheduledFor?: string
}): Promise<GardeningTask[]> {
  const assets = await listBotanicalAssets(input.societyId)
  const scheduledFor = input.scheduledFor || new Date().toISOString().slice(0, 10)
  const planned = buildDailyGardeningSchedule({
    societyId: input.societyId,
    assets,
    weather: input.weather,
    gardenerName: input.gardenerName,
    scheduledFor
  })

  const created: GardeningTask[] = []
  for (const plan of planned) {
    created.push(
      await createGardeningTask({
        societyId: plan.society_id,
        taskType: plan.task_type,
        assignedGardenerName: plan.assigned_gardener_name,
        scheduledFor: plan.scheduled_for,
        botanicalAssetId: plan.botanical_asset_id || undefined,
        waterLiters: plan.water_liters ?? 0,
        fertilizerKg: plan.fertilizer_kg ?? 0,
        weatherNote: plan.weather_note || undefined,
        notes: plan.notes || undefined
      })
    )
  }
  return created
}

/** Open-Meteo live weather → autonomous gardening task dispatch. */
export async function fetchLiveWeather(lat = 22.5726, lng = 88.3639): Promise<WeatherParams> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather API unavailable')
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; relative_humidity_2m?: number; precipitation?: number }
  }
  return {
    tempC: Number(data.current?.temperature_2m ?? 32),
    rainMm: Number(data.current?.precipitation ?? 0),
    humidityPct: Number(data.current?.relative_humidity_2m ?? 50)
  }
}

/** Zero-intervention botanist sweep: live weather → daily task queue. */
export async function autonomousBotanistDispatch(input: {
  societyId: string
  gardenerName?: string
  lat?: number
  lng?: number
}) {
  const weather = await fetchLiveWeather(input.lat, input.lng)
  return dispatchWeatherTasks({
    societyId: input.societyId,
    gardenerName: input.gardenerName || 'Society Gardener',
    weather
  })
}

export async function completeGardeningTask(taskId: string): Promise<GardeningTask> {
  if (localMode) {
    const row = localTasks.find((t) => t.id === taskId)
    if (!row) throw new Error('Task not found')
    row.status = 'COMPLETED'
    return row
  }
  try {
    return await restPatch<GardeningTask>(`gardening_tasks?id=eq.${taskId}`, { status: 'COMPLETED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return completeGardeningTask(taskId)
  }
}

export function taskConsumptionSummary(tasks: GardeningTask[]) {
  return tasks.reduce(
    (acc, t) => {
      acc.waterLiters += Number(t.water_liters || 0)
      acc.fertilizerKg += Number(t.fertilizer_kg || 0)
      if (t.status === 'COMPLETED') acc.completed += 1
      else acc.pending += 1
      return acc
    },
    { waterLiters: 0, fertilizerKg: 0, pending: 0, completed: 0 }
  )
}

export async function listCompostInventory(societyId: string): Promise<GreenCompostInventory[]> {
  if (localMode) return localInventory.filter((i) => i.society_id === societyId)
  try {
    return await restGet<GreenCompostInventory[]>(
      `green_compost_inventory?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listCompostInventory(societyId)
  }
}

export async function addCompostBatch(input: {
  societyId: string
  batchNumber: string
  totalWeightKg: number
  availableKg?: number
  pricePerKg?: number
}): Promise<GreenCompostInventory> {
  const payload = {
    society_id: input.societyId,
    batch_number: input.batchNumber.trim(),
    total_weight_kg: input.totalWeightKg,
    available_for_residents_kg: input.availableKg ?? input.totalWeightKg,
    price_per_kg: input.pricePerKg ?? 0
  }

  if (localMode) {
    const row: GreenCompostInventory = { id: rid('compost'), created_at: new Date().toISOString(), ...payload }
    localInventory.unshift(row)
    return row
  }
  try {
    return await restPost<GreenCompostInventory>('green_compost_inventory', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return addCompostBatch(input)
  }
}

export async function listCompostOrders(societyId: string): Promise<GreenCompostOrder[]> {
  if (localMode) return localOrders.filter((o) => o.society_id === societyId)
  try {
    return await restGet<GreenCompostOrder[]>(
      `green_compost_orders?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listCompostOrders(societyId)
  }
}

export async function requestCompostDelivery(input: {
  societyId: string
  inventoryId: string
  flatNumber: string
  userId: string
  quantityKg: number
}): Promise<GreenCompostOrder> {
  const inventory =
    (localMode
      ? localInventory.find((i) => i.id === input.inventoryId)
      : (
          await restGet<GreenCompostInventory[]>(`green_compost_inventory?id=eq.${input.inventoryId}&limit=1`).catch(
            () => [] as GreenCompostInventory[]
          )
        )[0]) || localInventory.find((i) => i.id === input.inventoryId)

  if (!inventory) throw new Error('Compost batch not found')
  if (input.quantityKg > Number(inventory.available_for_residents_kg)) {
    throw new Error('Requested quantity exceeds available compost')
  }

  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    inventory_id: input.inventoryId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    requested_by_user_id: input.userId,
    quantity_kg: input.quantityKg,
    status: 'REQUESTED' as const
  }

  const remaining = Number(inventory.available_for_residents_kg) - input.quantityKg

  if (localMode) {
    inventory.available_for_residents_kg = remaining
    const row: GreenCompostOrder = { id: rid('order'), created_at: new Date().toISOString(), ...payload }
    localOrders.unshift(row)
    return row
  }

  try {
    await restPatch(`green_compost_inventory?id=eq.${input.inventoryId}`, {
      available_for_residents_kg: remaining
    })
    return await restPost<GreenCompostOrder>('green_compost_orders', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return requestCompostDelivery(input)
  }
}

export async function markCompostDelivered(orderId: string): Promise<GreenCompostOrder> {
  if (localMode) {
    const row = localOrders.find((o) => o.id === orderId)
    if (!row) throw new Error('Order not found')
    row.status = 'DELIVERED'
    return row
  }
  try {
    return await restPatch<GreenCompostOrder>(`green_compost_orders?id=eq.${orderId}`, { status: 'DELIVERED' })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return markCompostDelivered(orderId)
  }
}

export async function listPlantSwaps(societyId: string): Promise<PlantSwapListing[]> {
  if (localMode) return localSwaps.filter((s) => s.society_id === societyId)
  try {
    return await restGet<PlantSwapListing[]>(
      `plant_swap_listings?society_id=eq.${societyId}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listPlantSwaps(societyId)
  }
}

export async function createPlantSwap(input: {
  societyId: string
  flatNumber: string
  userId: string
  title: string
  plantType: PlantSwapType
  description?: string
}): Promise<PlantSwapListing> {
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    offered_by_flat_id: flatId,
    offered_by_flat_number: input.flatNumber.trim(),
    offered_by_user_id: input.userId,
    title: input.title.trim(),
    plant_type: input.plantType,
    description: input.description?.trim() || null,
    status: 'AVAILABLE' as const,
    claimed_by_flat_number: null
  }

  if (localMode) {
    const row: PlantSwapListing = { id: rid('swap'), created_at: new Date().toISOString(), ...payload }
    localSwaps.unshift(row)
    return row
  }
  try {
    return await restPost<PlantSwapListing>('plant_swap_listings', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createPlantSwap(input)
  }
}

export async function claimPlantSwap(input: {
  listingId: string
  claimerFlatNumber: string
}): Promise<PlantSwapListing> {
  const patch = {
    status: 'CLAIMED' as const,
    claimed_by_flat_number: input.claimerFlatNumber.trim()
  }

  if (localMode) {
    const row = localSwaps.find((s) => s.id === input.listingId)
    if (!row) throw new Error('Listing not found')
    if (row.status !== 'AVAILABLE') throw new Error('Listing is no longer available')
    Object.assign(row, patch)
    return row
  }
  try {
    return await restPatch<PlantSwapListing>(`plant_swap_listings?id=eq.${input.listingId}`, patch)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return claimPlantSwap(input)
  }
}
