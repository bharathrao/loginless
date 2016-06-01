var crypto  = require('./crypto')
var Account = require('./Account')

function ll(baseurl, authurl, network, errorHandler) {
  var loginless   = {}
  var bitcoinutil = require('bitcoinutil')(network)

  var nonce = loginless.nonce = require('./nonce')(authurl)
  var Rest = loginless.rest = require('./Rest')(baseurl, loginless, nonce, crypto)
  loginless.socket = require('./socket')(loginless, nonce, crypto, errorHandler)
  
  var account, loginPromise
  var userPrivateKey

  loginless.createServerKey = function (privateKey, registrationData) {
    privateKey    = bitcoinutil.addressFromPrivateKey(privateKey)
    var signature = bitcoinutil.signMessage(privateKey.privateKey, registrationData)
    loginPromise  = Rest.post(nonce.authUri, {},[{ message: registrationData, signature: signature }], beforeSend.bind(undefined, privateKey.address))
      .then(function (meData) {
        var loginData = createAccount(meData, privateKey, network)
        logServerKey("CREATE")
        return loginData
      })
    return loginPromise
  }

  loginless.getServerKey = function (privateKey) {
    privateKey   = bitcoinutil.addressFromPrivateKey(privateKey)
    loginPromise = Rest.get(nonce.authUri + privateKey.publicKey, {}, beforeSend.bind(undefined, privateKey.address))
      .then(function (meData) {
        var loginData = createAccount(meData, privateKey, network)
        logServerKey("GET")
        return loginData
      })
    return loginPromise
  }

  function logServerKey(action){
    console.log("Successful:", action,  "server key. userid:", account.userid, "multisig:", account.accountid, "marginid:", account.serverAddress)
  }
  loginless.getAccount = function () {
    return account
  }

  loginless.getPromise = function () {
    return loginPromise
  }

  loginless.getUserPrivateKey = function () {
    return userPrivateKey
  }

  loginless.setUserPrivateKey = function (privateKey) {
    userPrivateKey = privateKey
  }

  loginless.delUserPrivateKey = function () {
    userPrivateKey = undefined
  }

  function createAccount(loginData, privateKey, network) {
    loginless.setUserPrivateKey(privateKey)
    account = Account(loginData.serverPublicKey, network, privateKey.privateKey)
    return loginData
  }

  function beforeSend(address) {
    return {
      "content-type" : "application/json",
      "nonce"        : nonce.getNonce(),
      "Authorization": crypto.getAuthorization(address)
    }
  }

  return loginless
}

ll.Account = Account
ll.crypto  = crypto
ll.Peer    = require('./Peer')

module.exports = ll