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

  loginless.registerKey = function (privateKeyWIF, registrationData) {
    affirm(privateKeyWIF, 'Private key missing')
    var key       = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var signature = bitcoinutil.signMessage(key.privateKey, registrationData)
    var regMesg   = [{ message: registrationData, signature: signature }]
    var authUrl = baseurl + authUri
    var headers = getHeaders(crypto.getAuthorization(key.address))
    return initLoginless(restjs.post(authUrl, headers, regMesg), key.privateKey)
  }

  loginless.getServerKey = function (privateKeyWIF) {
    affirm(privateKeyWIF, 'Private key missing')
    var key  = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var auth = crypto.getAuthorization(key.address)
    var authUrl = baseurl + authUri + '/' + key.publicKey
    var headers = getHeaders(auth)
    return initLoginless(restjs.get(authUrl, headers), key.privateKey)
  }

  function getHeaders(auth){
    return { Authorization: auth, 'Content-Type': 'application/json'}
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
