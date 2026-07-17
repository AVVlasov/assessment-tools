import ru from '../../locales/ru/assessment.json'
import en from '../../locales/en/assessment.json'

type Dict = Record<string, unknown>

const catalogs: Record<string, Dict> = {
  ru: ru as Dict,
  en: en as Dict,
}

const getLang = (): string => {
  try {
    const stored = localStorage.getItem('th-lang')
    if (stored === 'en' || stored === 'ru') return stored
  } catch {
    /* ignore */
  }
  return 'ru'
}

export const t = (key: string, fallback?: string): string => {
  const lang = getLang()
  const parts = key.split('.')
  let node: unknown = catalogs[lang] || catalogs.ru
  for (const p of parts) {
    if (node && typeof node === 'object' && p in (node as Dict)) {
      node = (node as Dict)[p]
    } else {
      node = undefined
      break
    }
  }
  if (typeof node === 'string') return node
  // fallback to ru
  node = catalogs.ru
  for (const p of parts) {
    if (node && typeof node === 'object' && p in (node as Dict)) {
      node = (node as Dict)[p]
    } else {
      return fallback ?? key
    }
  }
  return typeof node === 'string' ? node : (fallback ?? key)
}
