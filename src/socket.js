module.exports = function (loginless, nonce, crypto, errorHandler) {
  var util     = require('util')
  var cache    = require("./cache.core")()
  var sock     = {}
  sock.logging = false

  sock.send = function (socket, method, uri, headers, body, params, retry) {
    params            = params || {}
    var account       = loginless.getAccount()
    var requestNonce  = nonce.getNonce()
    var authorization = crypto.getAuthorization(account.userid, account.secret, method, uri, { body: body, params: params }, requestNonce)
    headers               = headers || {}
    headers.authorization = authorization
    if (sock.logging) util.log(Date.now(), "sending on socket", method, uri)
    // cache.put(authorization, { method: method, uri: uri, headers: headers, body: body, params: params })
    var data = { headers: headers, method: method, uri: uri, params: params, body: body, nonce: requestNonce, current: Date.now(), retry: retry }
    cache.put(authorization, data)
    socket.emit(method + " " + uri, data)
  }

  sock.onAuthError = function (socket, message) {
    if (message.data.retry) return errorHandler && errorHandler(message.error)
    nonce.calibrate(message.ntp.client, message.ntp.server)
    var auth = message.data.headers.authorization
    var data = cache.get(auth)
    sock.send(socket, data.method, data.uri, data.headers, data.body, data.params, true)
  }

  sock.register = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, "GET", "/register", {}, { userid: account.userid, publicKey: account.userPublicKey }, {})
  }

  sock.unregister = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, "GET", "/unregister", {}, { userid: account.userid, publicKey: account.userPublicKey }, {})
  }

  sock.ntp = function (ntpData) {
    nonce.calibrate(ntpData.client, ntpData.server)
  }

  return sock
}
