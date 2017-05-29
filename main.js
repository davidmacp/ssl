'use strict'

const SSL = require('./index')

module.exports = new SSL()
  .useDomains(['am.dev.dadi.technology', 'ssl.am.dev.dadi.technology'])
  .storeIn('/data/app/dadi-ssl/certs', true) // SSL directory, create if missing.
  .useEnvironment('stage') // Environment (default: production).
  .provider('letsencrypt') // Provider default: letsencrypt.
  .registerTo('am@dadi.co') // Register certificate to email address.
  .autoRenew(true) // Auto renew certificate.
  .create() // Start process.