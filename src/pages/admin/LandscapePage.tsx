import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  addCompostBatch,
  completeGardeningTask,
  createGardeningTask,
  dispatchWeatherTasks,
  listBotanicalAssets,
  listCompostInventory,
  listCompostOrders,
  listGardeningTasks,
  markCompostDelivered,
  registerBotanicalAsset,
  taskConsumptionSummary
} from '../../api/botanistService'
import type { GardeningTask, GardeningTaskType, GreenCompostInventory, GreenCompostOrder, SocietyBotanicalAsset } from '../../types/db'
import { ui } from '../../lib/ui'

const TASK_TYPES: GardeningTaskType[] = ['WATERING', 'FERTILIZER', 'PRUNING', 'PEST_CONTROL']

export default function AdminLandscapePage() {
  const { currentSocietyId } = useAuth()
  const [assets, setAssets] = useState<SocietyBotanicalAsset[]>([])
  const [tasks, setTasks] = useState<GardeningTask[]>([])
  const [inventory, setInventory] = useState<GreenCompostInventory[]>([])
  const [orders, setOrders] = useState<GreenCompostOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [plantName, setPlantName] = useState('')
  const [species, setSpecies] = useState('')
  const [zone, setZone] = useState('Central Park')
  const [plantedDate, setPlantedDate] = useState('')

  const [gardener, setGardener] = useState('Landscape crew')
  const [taskType, setTaskType] = useState<GardeningTaskType>('WATERING')
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 10))
  const [waterLiters, setWaterLiters] = useState(10)
  const [fertilizerKg, setFertilizerKg] = useState(0)

  const [tempC, setTempC] = useState(36)
  const [rainMm, setRainMm] = useState(0)
  const [humidity, setHumidity] = useState(28)

  const [batchNumber, setBatchNumber] = useState('')
  const [batchKg, setBatchKg] = useState(50)
  const [pricePerKg, setPricePerKg] = useState(0)

  const consumption = useMemo(() => taskConsumptionSummary(tasks), [tasks])

  async function refresh() {
    if (!currentSocietyId) return
    const [a, t, inv, ord] = await Promise.all([
      listBotanicalAssets(currentSocietyId),
      listGardeningTasks(currentSocietyId),
      listCompostInventory(currentSocietyId),
      listCompostOrders(currentSocietyId)
    ])
    setAssets(a)
    setTasks(t)
    setInventory(inv)
    setOrders(ord)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId])

  if (!currentSocietyId) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Select a society to manage landscape operations.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Landscape ops</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Gardening task manager</h2>
        <p className={`mt-2 ${ui.body}`}>
          Tag botanical assets, dispatch weather-aware schedules, track water/fertilizer use, and publish compost batches.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <article className={ui.card}>
          <p className={ui.eyebrow}>Assets</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{assets.length}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Pending tasks</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{consumption.pending}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Water (L)</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{consumption.waterLiters}</p>
        </article>
        <article className={ui.card}>
          <p className={ui.eyebrow}>Fertilizer (kg)</p>
          <p className="mt-2 text-2xl font-semibold text-syncra-primary">{consumption.fertilizerKg}</p>
        </article>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Register botanical asset</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void registerBotanicalAsset({
              societyId: currentSocietyId,
              plantName,
              species,
              locationZone: zone,
              plantedDate: plantedDate || undefined
            })
              .then((row) => {
                setPlantName('')
                setSpecies('')
                setMessage(`Registered ${row.plant_name} with QR ${row.qr_tag_code}`)
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Register failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Plant name</label>
            <input className={ui.input} value={plantName} onChange={(e) => setPlantName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Species</label>
            <input className={ui.input} value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Azadirachta indica" />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Location zone</label>
            <input className={ui.input} value={zone} onChange={(e) => setZone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Planted date</label>
            <input className={ui.input} type="date" value={plantedDate} onChange={(e) => setPlantedDate(e.target.value)} />
          </div>
          <button type="submit" className={ui.btnPrimary}>
            Create QR-tagged plant
          </button>
        </form>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Assign gardening task</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            void createGardeningTask({
              societyId: currentSocietyId,
              taskType,
              assignedGardenerName: gardener,
              scheduledFor,
              waterLiters,
              fertilizerKg
            })
              .then(() => {
                setMessage('Task assigned.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Assign failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Gardener</label>
            <input className={ui.input} value={gardener} onChange={(e) => setGardener(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Task type</label>
            <select className={ui.input} value={taskType} onChange={(e) => setTaskType(e.target.value as GardeningTaskType)}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Scheduled for</label>
            <input className={ui.input} type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Water (L)</label>
            <input className={ui.input} type="number" min={0} value={waterLiters} onChange={(e) => setWaterLiters(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Fertilizer (kg)</label>
            <input
              className={ui.input}
              type="number"
              min={0}
              step={0.1}
              value={fertilizerKg}
              onChange={(e) => setFertilizerKg(Number(e.target.value) || 0)}
            />
          </div>
          <button type="submit" className={ui.btnPrimary}>
            Assign task
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <h4 className="font-semibold text-syncra-primary">Weather auto-dispatch</h4>
          <p className={`mt-1 text-sm ${ui.body}`}>Generate daily watering / care tasks from temperature, rain, and humidity.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <label className={ui.label}>Temp °C</label>
              <input className={ui.input} type="number" value={tempC} onChange={(e) => setTempC(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <label className={ui.label}>Rain mm</label>
              <input className={ui.input} type="number" value={rainMm} onChange={(e) => setRainMm(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <label className={ui.label}>Humidity %</label>
              <input className={ui.input} type="number" value={humidity} onChange={(e) => setHumidity(Number(e.target.value) || 0)} />
            </div>
            <button
              type="button"
              className={`self-end ${ui.btnSecondary}`}
              onClick={() =>
                void dispatchWeatherTasks({
                  societyId: currentSocietyId,
                  gardenerName: gardener,
                  weather: { tempC, rainMm, humidityPct: humidity },
                  scheduledFor
                })
                  .then((created) => {
                    setMessage(`Dispatched ${created.length} weather-aware task(s).`)
                    return refresh()
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Dispatch failed'))
              }
            >
              Auto-dispatch
            </button>
          </div>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Task board</h3>
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <article key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-semibold text-syncra-primary">
                  {task.task_type} · {task.assigned_gardener_name}
                </p>
                <p className={`text-sm ${ui.body}`}>
                  {task.scheduled_for} · water {task.water_liters || 0} L · fert {task.fertilizer_kg || 0} kg
                </p>
                {task.weather_note ? <p className="text-xs text-slate-500">{task.weather_note}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{task.status}</span>
                {task.status === 'PENDING' ? (
                  <button
                    type="button"
                    className={ui.btnGhost}
                    onClick={() =>
                      void completeGardeningTask(task.id)
                        .then(() => refresh())
                        .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
                    }
                  >
                    Mark done
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {tasks.length === 0 ? <p className={`text-sm ${ui.body}`}>No gardening tasks yet.</p> : null}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Compost batches</h3>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            void addCompostBatch({
              societyId: currentSocietyId,
              batchNumber,
              totalWeightKg: batchKg,
              pricePerKg
            })
              .then(() => {
                setBatchNumber('')
                setMessage('Compost batch published for residents.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Batch failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Batch #</label>
            <input className={ui.input} value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Total kg</label>
            <input className={ui.input} type="number" min={1} value={batchKg} onChange={(e) => setBatchKg(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>₹ / kg</label>
            <input className={ui.input} type="number" min={0} value={pricePerKg} onChange={(e) => setPricePerKg(Number(e.target.value) || 0)} />
          </div>
          <button type="submit" className={`self-end ${ui.btnPrimary}`}>
            Add batch
          </button>
        </form>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {inventory.map((batch) => (
            <article key={batch.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-syncra-primary">{batch.batch_number}</p>
              <p className={`text-sm ${ui.body}`}>
                Available {batch.available_for_residents_kg} / {batch.total_weight_kg} kg
              </p>
            </article>
          ))}
        </div>

        <h4 className="mt-6 font-semibold text-syncra-primary">Doorstep orders</h4>
        <div className="mt-3 space-y-2">
          {orders.map((order) => (
            <article key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
              <p className={`text-sm ${ui.body}`}>
                Flat {order.flat_number} · {order.quantity_kg} kg · {order.status}
              </p>
              {order.status === 'REQUESTED' ? (
                <button
                  type="button"
                  className={ui.btnGhost}
                  onClick={() =>
                    void markCompostDelivered(order.id)
                      .then(() => refresh())
                      .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
                  }
                >
                  Mark delivered
                </button>
              ) : null}
            </article>
          ))}
          {orders.length === 0 ? <p className={`text-sm ${ui.body}`}>No resident compost orders.</p> : null}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Tagged plants</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {assets.map((asset) => (
            <article key={asset.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-syncra-primary">{asset.plant_name}</p>
              <p className={`text-sm ${ui.body}`}>
                {asset.qr_tag_code} · {asset.location_zone} · {asset.health_status}
              </p>
              <p className="text-xs text-emerald-700">
                {asset.carbon_offset_kg} kg CO₂
                {asset.adopted_by_flat_number ? ` · adopted by ${asset.adopted_by_flat_number}` : ''}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
