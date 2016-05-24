var affirm = require('affirm.js')

module.exports = (function () {
  global.offset = global.offset || 0

  var forNonce  = { POST: true, PUT: true, DELETE: true, OPTIONS: true, TRACE: true }
  var logging   = true

  var nonce     = {}
  nonce.authUri  = '/api/auth/'

  nonce.logging = function(isLogNonceOffset) {
    affirm(typeof(isLogNonceOffset === 'boolean'), 'Logging should be true or false')

    logging = isLogNonceOffset
  }

  nonce.calibrateREST = function (clientTimestamp, serverTimestamp, method, url) {
    if (forNonce[method] || url.startsWith(nonce.authUri)) {
      nonce.calibrate(serverTimestamp, clientTimestamp, method, url)
    }
  }

  nonce.calibrate = function (clientTimestamp, serverTimestamp) {
    if (clientTimestamp && serverTimestamp) {
      global.offset = serverTimestamp - clientTimestamp
      if(logging) console.log('Nonce offset:', global.offset, 'clientTimestamp:', clientTimestamp, 'serverTimestamp:', serverTimestamp )
    }
  }

  nonce.getNonce = function () {
    return Date.now() + global.offset
  }

  return nonce
})()
