module.exports = function (authUri) {
  var util = require('util')
  var offset     = 0
  var nonce      = {}
  nonce.forNonce = { POST: true, PUT: true, DELETE: true, OPTIONS: true, TRACE: true }
  nonce.logging  = false
  nonce.authUri  = authUri

  nonce.calibrateREST = function (clientTimestamp, serverTimestamp, method, url) {
    if (nonce.forNonce[method] || url.startsWith(nonce.authUri)) {
      nonce.calibrate(serverTimestamp, clientTimestamp, method, url)
    }
  }

  nonce.calibrate = function (clientTimestamp, serverTimestamp) {
    if (clientTimestamp && serverTimestamp) {
      offset = serverTimestamp - clientTimestamp
      if (nonce.logging) util.log(Date.now(), 'Nonce offset:', offset, 'clientTimestamp:', clientTimestamp, 'serverTimestamp:', serverTimestamp)
    }
  }

  nonce.getNonce = function () {
    return Date.now() + offset
  }

  return nonce
}
