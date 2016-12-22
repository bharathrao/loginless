module.exports = function (loginless, baseUrl, nonce, crypto, errorHandler) {
  var util     = require('util')
  var cache    = require("./cache.core")()
  var io       = require('socket.io-client')
  var sock     = io(baseUrl, { rejectUnauthorized: true });
  sock.logging = false

  sock.send = function (method, uri, headers, body, params, retry) {
    params                = params || {}
    var account           = loginless.getAccount()
    var requestNonce      = nonce.getNonce()
    var authorization     = crypto.getAuthorization(account.userid, account.secret, method, uri, { body: body, params: params }, requestNonce)
    headers               = headers || {}
    headers.authorization = authorization
    headers.nonce = requestNonce

    if (sock.logging) util.log(Date.now(), "sending on socket", method, uri)
    var data = { headers: headers, method: method, uri: uri, params: params, body: body, retry: retry }
    cache.put(authorization, data)
    sock.emit(method + " " + uri, data)
  }

  sock.onAuthError = function (message) {
    if (message.data.retry) return errorHandler && errorHandler(message.error)
    nonce.calibrate(Date.now(), message['server-time'])
    var auth = message.data.headers.authorization
    var data = cache.get(auth)
    sock.send(data.method, data.uri, data.headers, data.body, data.params, true)
  }

  sock.register = function () {
    var account = loginless.getAccount()
    sock.send("GET", "/register", {}, { userid: account.userid, publicKey: account.userPublicKey }, {})
  }

  sock.unregister = function () {
    var account = loginless.getAccount()
    sock.send("GET", "/unregister", {}, { userid: account.userid, publicKey: account.userPublicKey }, {})
  }

  sock.on('server-time', function (serverTime) {
    nonce.calibrate(Date.now(), serverTime)
  })

  return sock
}
