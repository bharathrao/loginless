var assert      = require('affirm.js')
var Peer        = require("./Peer")
module.exports  = function (serverPublicKey, network, userPrivateKey) {
  assert(serverPublicKey, 'User: server public key not present');
  var account            = {}
  var peer               = Peer(serverPublicKey, network, userPrivateKey)

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
