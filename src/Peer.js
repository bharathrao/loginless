var affirm      = require('affirm.js')
var bitcoinutil = require('bitcoinutil')
var crypto      = require('./crypto')

module.exports = function (user1PublicKey, user2PrivateKey) {
  affirm(user1PublicKey, 'user1PublicKey must be present')
  affirm(user2PrivateKey, 'user2PrivateKey must be present')

  var network = user2PrivateKey[0] == 'K' || user2PrivateKey[0] == 'L' ? 'bitcoin' : 'testnet'

  var peer             = {}
  peer.user2PrivateKey = user2PrivateKey
  peer.user2PublicKey  = bitcoinutil.getPublicKey(peer.user2PrivateKey)
  peer.user1PublicKey  = user1PublicKey
  peer.user1Address    = bitcoinutil.toAddress(user1PublicKey, network)
  var multisig         = bitcoinutil.getMultisigAddress(2, [peer.user2PublicKey, peer.user1PublicKey])
  peer.accountid       = multisig.address
  peer.redeem          = multisig.redeem
  peer.user2Address    = bitcoinutil.toAddress(peer.user2PublicKey, network)
  peer.secret          = crypto.getSharedSecret(user2PrivateKey, peer.user1PublicKey)

  return peer
}
