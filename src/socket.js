module.exports = function (loginless, nonce, crypto, errorHandler) {
  var util     = require('util')
  var sock     = {}
  sock.logging = false

  sock.send = function (socket, method, uri, headers, body, retry) {
    var account           = loginless.getAccount()
    var requestNonce      = nonce.getNonce()
    var authorization     = crypto.getAuthorization(account.userid, account.secret, method, uri, body, requestNonce)
    headers               = headers || {}
    headers.authorization = authorization
    if (sock.logging) util.log(Date.now(), "sending on socket", method, uri)
    socket.emit(method + " " + uri, { headers: headers, method: method, uri: uri, body: body, nonce: requestNonce, current: Date.now(), retry: retry })
  }

  sock.onAuthError = function (socket, message) {
    if (message.data.retry) return errorHandler && errorHandler(message.error)
    nonce.calibrate(message.ntp.client, message.ntp.server)
    sock.send(socket, message.data.method, message.data.uri, message.data.headers, message.data.body, true)
  }

  sock.register = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, "GET", "/register", {}, { userid: account.userid, publicKey: account.userPublicKey })
  }

  sock.unregister = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, "GET", "/unregister", {}, { userid: account.userid, publicKey: account.userPublicKey })
  }

  sock.ntp = function (clientTimestamp, serverTimestamp) {
    nonce.calibrate(clientTimestamp, serverTimestamp)
  }

  return sock
}