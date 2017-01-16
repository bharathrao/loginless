var restjs      = require('rest.js')
var Account     = require('./Account')
var crypto      = require('./crypto')
var Rest        = require('./Rest')
var Socket      = require('./Socket')
var bitcoinutil = require('bitcoinutil')
var affirm      = require('affirm.js')

module.exports = function ll(origin, apiPath) {
  var loginless = {}
  var baseurl   = origin + apiPath
  var authUri   = loginless.authUri = '/auth'
  // var key, keyWIF

  loginless.registerKey = function (privateKeyWIF, registrationData) {
    affirm(privateKeyWIF, 'Private key missing')
    // keyWIF        = privateKeyWIF
    var key       = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var signature = bitcoinutil.signMessage(key.privateKey, registrationData)
    var headers   = { Authorization: crypto.getAuthorization(key.address) }
    var regMesg   = [{ message: registrationData, signature: signature }]
    return initLoginless(restjs.post(baseurl + '/' + authUri, headers, regMesg), key.privateKey)
  }

  loginless.getServerKey = function (privateKeyWIF) {
    affirm(privateKeyWIF, 'Private key missing')
    // keyWIF   = privateKeyWIF
    var key  = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var auth = crypto.getAuthorization(key.address)
    return initLoginless(restjs.get(baseurl + '/' + authUri + '/' + key.publicKey, { Authorization: auth }), key.privateKey)
  }

  function initLoginless(serverPromise, privateKey) {
    return serverPromise
      .then(function (meData) {
        loginless.account = Account(meData.body.serverPublicKey, privateKey)
        loginless.rest    = Rest(baseurl, loginless.account)
        loginless.socket  = Socket(origin, loginless.account)
        return meData
      })
  }

  return loginless
}
