var affirm = require('affirm.js')
var crypto = require('./crypto')

module.exports = function (user1PublicKey, network, user2PrivateKey) {
  affirm(user1PublicKey, 'user1PublicKey must be present')
  network = network || 'bitcoin'
  affirm(network === 'bitcoin' || network === 'testnet')
  var bitcoinutil      = require('bitcoinutil')(network)
  user2PrivateKey      = user2PrivateKey || bitcoinutil.makeRandom().privateKey
  var peer             = {}
  peer.user2PrivateKey = user2PrivateKey
  peer.user2PublicKey  = bitcoinutil.getPublicKey(peer.user2PrivateKey)
  peer.user1PublicKey  = user1PublicKey
  peer.user1Address    = bitcoinutil.toAddress(user1PublicKey)
  var multisig         = bitcoinutil.getMultisigAddress(2, [peer.user2PublicKey, peer.user1PublicKey])
  peer.accountid       = multisig.address
  peer.redeem          = multisig.redeem
  peer.user2Address    = bitcoinutil.toAddress(peer.user2PublicKey)
  peer.secret          = crypto.getSharedSecret(user2PrivateKey, peer.user1PublicKey, network)
  return peer
}
