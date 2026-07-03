/** Society join codes for resident self-registration. */

export type RegisteredSociety = {
  id: string
  name: string
  city: string
  joinCode: string
}

const JOIN_CODES_KEY = 'syncra-society-join-codes'
const DEMO_JOIN_CODE = 'WINDSOR2026'

function loadJoinCodeMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(JOIN_CODES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function saveJoinCodeMap(map: Record<string, string>) {
  localStorage.setItem(JOIN_CODES_KEY, JSON.stringify(map))
}

export function generateJoinCode(name: string) {
  const slug = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${slug || 'SOC'}${suffix}`
}

export function ensureSocietyJoinCode(societyId: string, societyName: string) {
  const map = loadJoinCodeMap()
  if (!map[societyId]) {
    map[societyId] = societyId === 'syncra-windsor-castle' ? DEMO_JOIN_CODE : generateJoinCode(societyName)
    saveJoinCodeMap(map)
  }
  return map[societyId]
}

export function listRegisteredSocieties(): RegisteredSociety[] {
  const map = loadJoinCodeMap()
  const societies: RegisteredSociety[] = [
    {
      id: 'syncra-windsor-castle',
      name: 'Syncra Windsor Castle',
      city: 'Bengaluru',
      joinCode: map['syncra-windsor-castle'] ?? DEMO_JOIN_CODE
    }
  ]

  try {
    const saved = localStorage.getItem('syncra-societies')
    if (saved) {
      const parsed = JSON.parse(saved) as Array<{ id: string; name: string; city: string }>
      for (const item of parsed) {
        const joinCode = ensureSocietyJoinCode(item.id, item.name)
        if (!societies.some((s) => s.id === item.id)) {
          societies.push({ id: item.id, name: item.name, city: item.city, joinCode })
        }
      }
    }
  } catch {
    // ignore
  }

  if (!map['syncra-windsor-castle']) {
    map['syncra-windsor-castle'] = DEMO_JOIN_CODE
    saveJoinCodeMap(map)
  }

  return societies
}

export function resolveSocietyByJoinCode(code: string): RegisteredSociety | null {
  const normalized = code.trim().toUpperCase()
  return listRegisteredSocieties().find((s) => s.joinCode.toUpperCase() === normalized) ?? null
}
