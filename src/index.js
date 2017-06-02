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
    affirm(privateKeyWIF, 'Private key expected')
    var key       = bitcoinutil.addressFromPrivateKey(privateKeyWIF)
    var signature = bitcoinutil.signMessage(key.privateKey, registrationData)
    var regMesg   = [{ message: registrationData, signature: signature }]
    var authUrl = baseurl + authUri
    var headers = getHeaders(crypto.getAuthorization(key.address))
    return restjs.post(authUrl, headers, regMesg).then(getBody)
  }

  loginless.getServerKey = function (publicKey) {
    affirm(publicKey, 'public key expected')
    var authUrl = baseurl + authUri + '/' + publicKey
    var headers = getHeaders()
    return restjs.get(authUrl, headers).then(getBody)
  }

  loginless.init = function(){
    loginless.rest    = loginless.rest || Rest(baseurl)
    loginless.socket  = loginless.socket || Socket(origin)
  }

  function getHeaders(auth) {
    var headers = {'Content-Type': 'application/json'}
    if(auth) headers.Authorization = auth
    return headers
  }

  function getBody(response) {
    return response && response.body
  }

  loginless.initApiKey = function(apiKeyData){
    loginless.account = Account.fromApiSecretKey(apiKeyData)
    loginless.rest    = Rest(baseurl, loginless.account)
    loginless.socket  = Socket(origin, loginless.account)
  }

  loginless.initPrivateKey = function(serverPublicKey, privateKey) {
    loginless.account = Account(serverPublicKey, privateKey)
    loginless.rest    = Rest(baseurl, loginless.account)
    loginless.socket  = Socket(origin, loginless.account)
  }

  return loginless
}
