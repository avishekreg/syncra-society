import type { MaintenanceDefaulter, VisitorLog, VisitorLogEvent, VisitorLogStatus } from '../types/db'
import { restGet, restPatch, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

const LOCAL_VISITOR_LOGS: VisitorLog[] = [
  {
    id: 'local-visitor-1',
    society_id: 'local',
    visitor_name: 'Mr. Sharma',
    purpose: 'Package delivery',
    vehicle_number: 'KA05AB1234',
    target_building: 'A',
    target_flat_number: '101',
    status: 'pending_approval',
    requested_at: new Date().toISOString()
  },
  {
    id: 'local-visitor-2',
    society_id: 'local',
    visitor_name: 'Mrs. Patel',
    purpose: 'Guest visit',
    vehicle_number: null,
    target_building: 'B',
    target_flat_number: '102',
    status: 'pending_approval',
    requested_at: new Date(Date.now() - 60_000).toISOString()
  }
]

let localVisitorLogMode = false
let localVisitorLogs = LOCAL_VISITOR_LOGS.map((entry) => ({ ...entry }))
const LOCAL_VISITOR_LOG_EVENTS: VisitorLogEvent[] = [
  {
    id: 'local-event-1',
    visitor_log_id: 'local-visitor-1',
    event_type: 'request_created',
    actor_user_id: null,
    notes: 'Local entry request created',
    created_at: new Date().toISOString()
  },
  {
    id: 'local-event-2',
    visitor_log_id: 'local-visitor-2',
    event_type: 'request_created',
    actor_user_id: null,
    notes: 'Local entry request created',
    created_at: new Date(Date.now() - 60_000).toISOString()
  }
]
let localVisitorLogEvents = LOCAL_VISITOR_LOG_EVENTS.map((entry) => ({ ...entry }))

const LOCAL_DEFAULTERS: MaintenanceDefaulter[] = []
let localDefaulterMode = false

function shouldFallbackToLocalMock(err: unknown) {
  return shouldUseLocalFallback(err)
}

function getLocalDefaulters(societyId: string) {
  return LOCAL_DEFAULTERS.filter((entry) => entry.society_id === societyId)
}

function createLocalDefaulter(payload: Omit<MaintenanceDefaulter, 'id' | 'created_at'>) {
  const newDefaulter: MaintenanceDefaulter = {
    id: `local-defaulter-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
    ...payload
  }
  LOCAL_DEFAULTERS.unshift(newDefaulter)
  return newDefaulter
}

function getLocalPendingLogs(_societyId: string, flatNumber: string) {
  return localVisitorLogs.filter((log) => log.status === 'pending_approval' && log.target_flat_number === flatNumber)
}

function getLocalLogsForSociety() {
  return localVisitorLogs
}

function getLocalLogEvents(visitorLogId: string) {
  return localVisitorLogEvents
    .filter((event) => event.visitor_log_id === visitorLogId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

function updateLocalLogStatus(id: string, status: Extract<VisitorLogStatus, 'approved' | 'denied'>, actorUserId: string) {
  const now = new Date().toISOString()
  const log = localVisitorLogs.find((entry) => entry.id === id)
  if (!log) {
    throw new Error('Unable to update local visitor log')
  }
  log.status = status
  log.actioned_at = now
  log.actioned_by_user_id = actorUserId
  log.updated_at = now

  localVisitorLogEvents.push({
    id: `local-event-${Math.random().toString(36).slice(2, 9)}`,
    visitor_log_id: id,
    event_type: status === 'approved' ? 'approved' : 'denied',
    actor_user_id: actorUserId,
    notes: `Local ${status} action recorded`,
    created_at: now
  })

  return Promise.resolve()
}

export async function listVisitorLogs(societyId: string): Promise<VisitorLog[]> {
  if (localVisitorLogMode) {
    return getLocalLogsForSociety()
  }

  try {
    return await restGet<VisitorLog[]>(`visitor_logs?society_id=eq.${societyId}&order=requested_at.desc`)
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      return getLocalLogsForSociety()
    }
    throw err
  }
}

export async function listVisitorLogsForFlat(
  societyId: string,
  flatNumber: string
): Promise<VisitorLog[]> {
  if (localVisitorLogMode) {
    return localVisitorLogs.filter((log) => log.target_flat_number === flatNumber)
  }

  try {
    return await restGet<VisitorLog[]>(
      `visitor_logs?society_id=eq.${societyId}&target_flat_number=eq.${encodeURIComponent(flatNumber)}&order=requested_at.desc`
    )
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      return localVisitorLogs.filter((log) => log.target_flat_number === flatNumber)
    }
    throw err
  }
}

export async function listPendingVisitorLogs(
  societyId: string,
  flatNumber: string
): Promise<VisitorLog[]> {
  if (localVisitorLogMode) {
    return getLocalPendingLogs(societyId, flatNumber)
  }

  try {
    return await restGet<VisitorLog[]>(
      `visitor_logs?society_id=eq.${societyId}&target_flat_number=eq.${encodeURIComponent(flatNumber)}&status=eq.pending_approval&order=requested_at.desc`
    )
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      return getLocalPendingLogs(societyId, flatNumber)
    }
    throw err
  }
}

export async function listVisitorLogEvents(visitorLogId: string): Promise<VisitorLogEvent[]> {
  if (localVisitorLogMode) {
    return getLocalLogEvents(visitorLogId)
  }

  try {
    return await restGet<VisitorLogEvent[]>(
      `visitor_log_events?visitor_log_id=eq.${visitorLogId}&order=created_at.asc`
    )
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      return getLocalLogEvents(visitorLogId)
    }
    throw err
  }
}

export async function listDefaulters(societyId: string): Promise<MaintenanceDefaulter[]> {
  if (localDefaulterMode) {
    return getLocalDefaulters(societyId)
  }

  try {
    return await restGet<MaintenanceDefaulter[]>(`maintenance_defaulters?society_id=eq.${societyId}&order=created_at.desc`)
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localDefaulterMode = true
      return getLocalDefaulters(societyId)
    }
    throw err
  }
}

export async function flagDefaulter(payload: Omit<MaintenanceDefaulter, 'id' | 'created_at'>) {
  if (localDefaulterMode) {
    return createLocalDefaulter(payload)
  }

  try {
    return await restPost<MaintenanceDefaulter>('maintenance_defaulters', {
      ...payload,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localDefaulterMode = true
      return createLocalDefaulter(payload)
    }
    throw err
  }
}

export async function createVisitorLog(payload: {
  society_id: string
  visitor_name: string
  purpose: string
  vehicle_number?: string
  target_building: string
  target_flat_number: string
}) {
  const now = new Date().toISOString()
  const body = {
    ...payload,
    status: 'pending_approval' as VisitorLogStatus,
    requested_at: now
  }

  if (localVisitorLogMode) {
    const created: VisitorLog = {
      id: `local-visitor-${Math.random().toString(36).slice(2, 9)}`,
      ...body
    }
    localVisitorLogs.unshift(created)
    await appendVisitorLogEvent(created.id, 'request_created', null, 'Local entry request created')
    return created
  }

  try {
    const created = await restPost<VisitorLog>('visitor_logs', body)
    await appendVisitorLogEvent(created.id, 'request_created', null, 'Entry request logged at gate')
    return created
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      const created: VisitorLog = {
        id: `local-visitor-${Math.random().toString(36).slice(2, 9)}`,
        ...body
      }
      localVisitorLogs.unshift(created)
      await appendVisitorLogEvent(created.id, 'request_created', null, 'Local entry request created')
      return created
    }
    throw err
  }
}

export async function updateVisitorLogStatus(
  id: string,
  status: Extract<VisitorLogStatus, 'approved' | 'denied'>,
  actorUserId: string
) {
  if (localVisitorLogMode) {
    return updateLocalLogStatus(id, status, actorUserId)
  }

  const now = new Date().toISOString()
  const eventType = status === 'approved' ? 'approved' : 'denied'
  try {
    await restPatch(`visitor_logs?id=eq.${id}`, {
      status,
      actioned_at: now,
      actioned_by_user_id: actorUserId,
      updated_at: now
    })
    await appendVisitorLogEvent(id, eventType, actorUserId)
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      return updateLocalLogStatus(id, status, actorUserId)
    }
    throw err
  }
}

export async function logVisitorExit(id: string, actorUserId?: string | null) {
  const now = new Date().toISOString()
  await restPatch(`visitor_logs?id=eq.${id}`, {
    status: 'exited',
    exited_at: now,
    updated_at: now
  })
  await appendVisitorLogEvent(id, 'exit_logged', actorUserId ?? null, 'Visitor exit recorded')
}

async function appendVisitorLogEvent(
  visitorLogId: string,
  eventType: VisitorLogEvent['event_type'],
  actorUserId: string | null,
  notes?: string
) {
  const entry: VisitorLogEvent = {
    id: `local-event-${Math.random().toString(36).slice(2, 9)}`,
    visitor_log_id: visitorLogId,
    event_type: eventType,
    actor_user_id: actorUserId,
    notes: notes ?? null,
    created_at: new Date().toISOString()
  }

  if (localVisitorLogMode) {
    localVisitorLogEvents.push(entry)
    return Promise.resolve(entry)
  }

  try {
    const created = await restPost('visitor_log_events', entry)
    return created
  } catch (err) {
    if (shouldFallbackToLocalMock(err)) {
      localVisitorLogMode = true
      localVisitorLogEvents.push(entry)
      return Promise.resolve(entry)
    }
    throw err
  }
}
