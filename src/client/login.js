var Rest        = require('./../common/REST')
var Account     = require('./../common/Account')
var nonce       = require('./../common/nonce')
var loginless   = require('./../common/loginless')
var bitcoinutil = require("./bitcoinutil")

module.exports = (function () {
  var me      = {}
  var baseurl = process.env.COINPIT_URL || ""
  var account, mePromise
  var myPrivateKey
  var eventHandlers = { 'error': consoleLog }

  function consoleLog() {
    console.log(arguments)
  }

  me.postMe = function (privateKey) {
    var message   = JSON.stringify({ publicKey: privateKey.publicKey, country: $COUNTRY, timestamp: Date.now(), ip: $CLIENT_IP })
    var signature = bitcoinutil.signMessage(privateKey.privateKey, message)
    mePromise     = Rest.post(baseurl + nonce.authUri, [{ message: message, signature: signature }], beforeSend.bind(undefined, privateKey.address))
      .then(function (meData) {
        return createAccount(meData, privateKey, $CONFIG.network)
      })
    return mePromise
  }

  me.on = function(event, handler) {
    if(!eventHandlers[event])
      throw new Error('Unknown event' + event)
    eventHandlers[event] = handler
  }

  me.off = function(event) {
    eventHandlers[event] = consoleLog
  }

  me.getMe = function (privateKey) {
    mePromise = Rest.get(baseurl + nonce.authUri + privateKey.publicKey, beforeSend.bind(undefined, privateKey.address))
      .then(function (meData) {
        return createAccount(meData, privateKey, $CONFIG.network)
      })
    return mePromise
  }

  me.getAccount = function () {
    return account
  }

  me.loadAccount = function (privateKey) {
    privateKey = bitcoinutil.addressFromPrivateKey(privateKey)
    return me.getMe(privateKey)
  }

  me.getPromise = function () {
    return mePromise
  }

  me.getMyPrivateKey = function () {
    return myPrivateKey
  }

  me.setMyPrivateKey = function (privateKey) {
    myPrivateKey = privateKey
  }

  me.delMyPrivateKey = function () {
    myPrivateKey = undefined
  }

  me.registerOnSocket = function (socket) {
    me.sendOnSocket(socket, { userid: account.myAddress, publicKey: account.myPublicKey }, "GET", "register")
  }

  me.unRegisterOnSocket = function (socket) {
    me.sendOnSocket(socket, { userid: account.myAddress, publicKey: account.myPublicKey }, "GET", "unregister")
  }

  // todo candidate for genering socket communication module similar to REST.js
  me.sendOnSocket = function (socket, body, method, uri, retry) {
    var requestNonce  = nonce.getNonce()
    var authorization = loginless.getAuthorization(account.myAddress, account.secret, method, uri, body, requestNonce)
    console.log("sending on socket", method, uri)
    socket.emit(uri, { authorization: authorization, method: method, uri: uri, body: body, nonce: requestNonce, current: Date.now(), retry: retry })
  }

  me.onSocketAuthError = function (socket, message) {
    if (message.data.retry) return eventHandlers.error(message.error)
    nonce.calibrate(message.ntp.client, message.ntp.server)
    me.sendOnSocket(socket, message.data.body, message.data.method, message.data.uri, true)
  }

  function createAccount(meData, privateKey, network) {
    me.setMyPrivateKey(privateKey)
    account = Account(meData.serverPublicKey, privateKey.privateKey, network)
    return meData
  }

  function beforeSend(address) {
    return {
      "content-type" : "application/json",
      "nonce"        : nonce.getNonce(),
      "Authorization": loginless.getAuthorization(address)
    }
  }

  return me
})()
