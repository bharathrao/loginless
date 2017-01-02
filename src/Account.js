var assert      = require('affirm.js')
var Peer        = require("./Peer")

module.exports  = function (serverPublicKey, userPrivateKey) {
  assert(serverPublicKey, 'Server public key is required');
  assert(userPrivateKey, 'User private key is required')
  var account            = {}
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
