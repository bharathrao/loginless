module.exports = function (loginless, nonce, crypto, errorHandler) {
  var sock = {}

  sock.send = function (socket, body, method, uri, retry) {
    var account = loginless.getAccount()
    var requestNonce  = nonce.getNonce()
    var authorization = crypto.getAuthorization(account.userid, account.secret, method, uri, body, requestNonce)
    console.log("sending on socket", method, uri)
    socket.emit(uri, { authorization: authorization, method: method, uri: uri, body: body, nonce: requestNonce, current: Date.now(), retry: retry })
  }

  sock.onAuthError = function (socket, message) {
    //todo: error should be thrown and handled by client
    if (message.data.retry) return errorHandler && errorHandler(message.error)
    nonce.calibrate(message.ntp.client, message.ntp.server)
    sock.send(socket, message.data.body, message.data.method, message.data.uri, true)
  }

  sock.register = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, { userid: account.userid, publicKey: account.userPublicKey }, "GET", "register")
  }

  sock.unregister = function (socket) {
    var account = loginless.getAccount()
    sock.send(socket, { userid: account.userid, publicKey: account.userPublicKey }, "GET", "unregister")
  }

  sock.ntp = function(clientTimestamp, serverTimestamp){
    nonce.calibrate(clientTimestamp, serverTimestamp)
  }

  return sock
}