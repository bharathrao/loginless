var assert      = require('affirm.js')
var Peer        = require("./Peer")
var bitcoinutil = require('bitcoinutil')

function Account(serverPublicKey, userPrivateKey) {
  return populateFromPeer(serverPublicKey, userPrivateKey)
}

Account.fromApiSecretKey = function(serverPublicKey, apikeyData){
  account = {}
  var network = apikeyData.userid.startsWith('1') ? 'bitcoin' : 'testnet'
  account.apikey        = apikeyData.secretKey
  account.userPublicKey = apikeyData.publicKey
  account.userid        = apikeyData.userid

  account.serverPublicKey = serverPublicKey
  account.serverAddress   = apikeyData.serverAddress
  account.accountid       = apikeyData.accountid
  var multisig         = bitcoinutil.getMultisigAddress(2, [account.userPublicKey, account.serverPublicKey], network)
  account.redeem          = multisig.redeem

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
