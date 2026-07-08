export function ordinalDay(day: number): string {
  const clamped = Math.min(28, Math.max(1, day))
  const mod100 = clamped % 100
  if (mod100 >= 11 && mod100 <= 13) return `${clamped}th`
  switch (clamped % 10) {
    case 1:
      return `${clamped}st`
    case 2:
      return `${clamped}nd`
    case 3:
      return `${clamped}rd`
    default:
      return `${clamped}th`
  }
}

export const MAINTENANCE_DUE_DAY_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1
  return {
    value: day,
    label: `Before the ${ordinalDay(day)} of every month`
  }
})
