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
}
