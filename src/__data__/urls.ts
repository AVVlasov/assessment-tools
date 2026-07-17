import { getNavigation, getNavigationValue, getConfig } from '@brojs/cli'

import pkg from '../../package.json'

const baseUrl = getNavigationValue(`${pkg.name}.main`)
const navs = getNavigation()
const config = getConfig()
const makeUrl = (url) => baseUrl + url

export const URLs = {
  baseUrl,
  apiBase: config[`${pkg.name}.api`] || '/api',
  auth: {
    url: makeUrl(navs[`link.${pkg.name}.auth`]),
    isOn: Boolean(navs[`link.${pkg.name}.auth`])
  },
  admin: '/assessment-tools/admin',
  expert: '/assessment-tools/expert',
  eventCreate: '/assessment-tools/events/create',
  rateHall: '/assessment-tools/rate/hall',
}

export const getHallRateUrl = (token: string): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${URLs.rateHall}/${token}`
  }
  return `${URLs.rateHall}/${token}`
}

export const getExpertUrl = (token: string): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${URLs.expert}/${token}`
  }
  return `${URLs.expert}/${token}`
}
