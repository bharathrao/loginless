var affirm      = require('affirm.js')
var loginless = require('./loginless')

module.exports = function (user1PublicKey, user2PrivateKey, network) {
  affirm(user1PublicKey, 'account, user1PublicKey must be present')
  affirm(user2PrivateKey, 'account, user2PrivateKey must be present')
  network = network || 'bitcoin'
  affirm(network === 'bitcoin' || network === 'testnet')

  var peer             = {}
  var bitcoinutil      = require('bitcoinutil')(network)

  peer.user2PrivateKey = user2PrivateKey
  peer.user2PublicKey  = bitcoinutil.getPublicKey(peer.user2PrivateKey)
  peer.user1PublicKey  = user1PublicKey
  peer.user1Address    = bitcoinutil.toAddress(user1PublicKey)
  var multisig         = bitcoinutil.getMultisigAddress(2, [peer.user2PublicKey, peer.user1PublicKey])
  peer.accountid       = multisig.address
  peer.redeem          = multisig.redeem
  peer.user2Address    = bitcoinutil.toAddress(peer.user2PublicKey)
  peer.secret          = loginless.getSharedSecret(user2PrivateKey, peer.user1PublicKey, network)
  return peer
}
