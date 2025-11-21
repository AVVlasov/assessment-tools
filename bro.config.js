const pkg = require('./package')

module.exports = {
  apiPath: 'stubs/api',
  webpackConfig: {
    output: {
      publicPath: `/static/${pkg.name}/${process.env.VERSION || pkg.version}/`
    }
  },
  /* use https://admin.bro-js.ru/ to create config, navigations and features */
  navigations: {
    'assessment-tools.main': '/assessment-tools',
    'assessment-tools.admin': '/assessment-tools/admin',
    'assessment-tools.expert': '/assessment-tools/expert',
    'link.assessment-tools.auth': '/auth'
  },
  features: {
    'assessment-tools': {
      // add your features here in the format [featureName]: { value: string }
    },
  },
  config: {
    'assessment-tools.api': '/api'
  }
}
