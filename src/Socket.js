var util   = require('util')
var io     = require('socket.io-client')
var affirm = require('affirm.js')
var cache  = require('ephemeral-cache')()
var crypto = require('./crypto')
var nonce  = require('./nonce')

module.exports = function (baseUrl, account, errorHandler) {
  var socket     = io(baseUrl, { rejectUnauthorized: true });
  socket.logging = false

  affirm(account.userid, 'Missing userid in account')
  affirm(account.secret, 'Missing secret in account')
  affirm(account.userPublicKey, 'Missing userPublicKey in account')

  socket.send = function (request) {
    var method  = request.method
    var uri     = request.uri
    var headers = request.headers || {}
    var body    = request.body
    var params  = request.params || {}
    var retry   = request.retry
    affirm(typeof method === 'string', 'Invalid method')
    affirm(typeof uri === 'string', 'Invalid uri')

    params                = params || {}
    var requestNonce      = nonce.getNonce()
    var authorization     = crypto.getAuthorization(account.userid, account.secret, method, uri, { body: body, params: params }, requestNonce)
    headers               = headers || {}
    headers.Authorization = authorization
    headers.Nonce         = requestNonce

    if (socket.logging) util.log(Date.now(), "sending on socket", method, uri)
    var data = { headers: headers, method: method, uri: uri, params: params, body: body, retry: retry }
    cache.put(authorization, data)
    socket.emit(method + " " + uri, data)
  }

  socket.onAuthError = function (message) {
    if(!validMessage(message)) return console.log('*** WARNING: Ignoring invalid server message: ', message)
    if (message.data.retry) return errorHandler && errorHandler(message.error)
    nonce.calibrate(Date.now(), message['server-time'])
    var auth = message.data.headers.Authorization
    var data = cache.get(auth)
    if(!data) return console.log('*** WARNING: Skipping retry for invalid Authorization', auth)
    socket.send({ method: data.method, uri: data.uri, headers: data.headers, body: data.body, params: data.params, retry: true })
  }

  socket.register = function () {
    socket.send({ method: "GET", uri: "/register", body: { userid: account.userid, publicKey: account.userPublicKey } })
  }

  socket.unregister = function () {
    socket.send({ method: "GET", uri: "/unregister", body: { userid: account.userid, publicKey: account.userPublicKey } })
  }

  socket.on('server-time', function (serverTime) {
    nonce.calibrate(Date.now(), serverTime)
  })

  function validMessage(message) {
    return message && message.data && message.data.headers && message.data.headers.Authorization
  }

  return socket
}
