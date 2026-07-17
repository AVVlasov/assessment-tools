/** YYYY-MM-DD from local Date */
export const toDateInputValue = (date: Date = new Date()): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Accepts native date input (YYYY-MM-DD) or typed ru formats (dd.mm.yyyy / dd/mm/yyyy).
 * Returns YYYY-MM-DD or null if invalid.
 */
export const parseDateInput = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
      return trimmed
    }
    return null
  }

  const match = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const dt = new Date(year, month - 1, day)
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** ISO string at local noon — avoids UTC day-shift in Mongo/JSON */
export const toEventDateIso = (yyyyMmDd: string): string => `${yyyyMmDd}T12:00:00`

export const formatEventDateRu = (value: string | Date): string => {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** dd.mm.yyyy for manual typing */
export const toRuDateDots = (yyyyMmDd: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd
  const [y, m, d] = yyyyMmDd.split('-')
  return `${d}.${m}.${y}`
}
