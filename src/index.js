var util    = require('util')
var restjs  = require('rest.js')
var Account = require('./Account')
var crypto  = require('./crypto')
var Rest    = require('./Rest')
var Socket  = require('./Socket')

module.exports = function ll(baseurl) {
  var loginless   = {}
  var bitcoinutil = require('bitcoinutil')
  var authUri     = loginless.authUri = '/auth'

  loginless.registerKey = function (privateKeyWIF, registrationData) {
    key           = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var signature = bitcoinutil.signMessage(key.privateKey, registrationData)
    var headers   = { Authorization: crypto.getAuthorization(key.address) }
    var regMesg   = [{ message: registrationData, signature: signature }]
    return initLoginless(restjs.post(baseurl + '/' + authUri, headers, regMesg), key.privateKey)
  }

  loginless.getServerKey = function (privateKeyWIF) {
    key      = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var auth = crypto.getAuthorization(key.address)
    return initLoginless(restjs.get(baseurl + '/' + authUri + '/' + key.publicKey, { Authorization: auth }), key.privateKey)
  }

  function initLoginless(serverPromise, privateKey) {
    return serverPromise
      .then(function (meData) {
        return account = Account(meData.body.serverPublicKey, privateKey)
      })
      .then(function (account) {
        loginless.rest = Rest(baseurl, account)
        loginless.socket = Socket(baseurl, account)
        return account
      })
  }

  return loginless
}
