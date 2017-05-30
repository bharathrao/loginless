var assert      = require('affirm.js')
var Peer        = require("./Peer")

function Account(serverPublicKey, userPrivateKey) {
  return populateFromPeer(serverPublicKey, userPrivateKey)
}

Account.fromApiSecretKey = function(apikeyData){
  account = {}
  account.apikey        = apikeyData.apiSecretKey
  account.userid        = apikeyData.userid
  account.serverAddress = apikeyData.user1Address
  account.accountid     = apikeyData.accountid
  return account
}

var populateFromPeer = Account.fromPrivateKey = function (serverPublicKey, userPrivateKey){
  assert(serverPublicKey, 'Server public key is required');
  assert(userPrivateKey || apiSecretKey, 'User private key/api SecretKey is required')
  var account = {}
  var peer               = Peer(serverPublicKey, userPrivateKey)
  account.userPrivateKey = peer.user2PrivateKey
  account.userPublicKey  = peer.user2PublicKey
  account.userid         = peer.user2Address

  account.serverPublicKey = peer.user1PublicKey
  account.serverAddress   = peer.user1Address

  account.accountid = peer.accountid
  account.redeem    = peer.redeem
  account.secret    = peer.secret
  return account
}
module.exports = Account
