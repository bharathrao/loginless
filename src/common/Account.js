var Peer       = require("./Peer")
module.exports = function (theirPublicKey, myPrivateKey, network) {
  var peer = Peer(theirPublicKey, myPrivateKey, network)
  return {
    myPrivateKey  : myPrivateKey,
    myPublicKey   : peer.user2PublicKey,
    myAddress     : peer.user2Address,
    theirPublicKey: peer.user1PublicKey,
    theirAddress  : peer.user1Address,
    accountid     : peer.accountid,
    redeem        : peer.redeem,
    secret        : peer.secret
  }
}
