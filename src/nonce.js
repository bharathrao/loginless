var affirm = require('affirm.js')

module.exports = function (authUri) {
  var offset     = 0
  var nonce      = {}
  nonce.forNonce = { POST: true, PUT: true, DELETE: true, OPTIONS: true, TRACE: true }
  var logging    = true
  nonce.authUri  = authUri

  nonce.logging = function (isLogNonceOffset) {
    affirm(typeof(isLogNonceOffset === 'boolean'), 'Logging should be true or false')

    logging = isLogNonceOffset
  }

  nonce.calibrateREST = function (clientTimestamp, serverTimestamp, method, url) {
    if (nonce.forNonce[method] || url.startsWith(nonce.authUri)) {
      nonce.calibrate(serverTimestamp, clientTimestamp, method, url)
    }
  }

  nonce.calibrate = function (clientTimestamp, serverTimestamp) {
    if (clientTimestamp && serverTimestamp) {
      offset = serverTimestamp - clientTimestamp
      if (logging) console.log('Nonce offset:', offset, 'clientTimestamp:', clientTimestamp, 'serverTimestamp:', serverTimestamp)
    }
  }

  nonce.getNonce = function () {
    return Date.now() + offset
  }
  
  return nonce
}
