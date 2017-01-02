var bitcoin    = require('bitcoinjs-lib')
var crypto     = require('crypto')
var affirm     = require('affirm.js')

module.exports = (function () {
  var ll = {}
  var defaultLatencyTolerance = 10

  ll.getSharedSecret = function (myPrivateKeyWif, theirPublicKeyHex) {
    affirm(myPrivateKeyWif, 'Need privateKey for computing shared secret')
    affirm(theirPublicKeyHex, 'Need other party publicKey for computing shared secret')
    var network = myPrivateKeyWif[0] == 'K' || myPrivateKeyWif[0] == 'L' ? 'bitcoin' : 'testnet'
    network = network || 'bitcoin'

    var myEcdhKey = getEcdhKey(bitcoin.ECPair.fromWIF(myPrivateKeyWif, bitcoin.networks[network]))
    return myEcdhKey.computeSecret(theirPublicKeyHex, 'hex', 'hex')
  }

  function getEcdhKey(privateKey) {
    var ecdhKey = crypto.createECDH('secp256k1')
    ecdhKey.generateKeys()
    ecdhKey.setPrivateKey(privateKey.d.toBuffer(32))
    ecdhKey.setPublicKey(privateKey.getPublicKeyBuffer())
    return ecdhKey
  }

  ll.hash160 = function (input) {
    affirm(input, 'No input provided for hash160')

    var hash = bitcoin.crypto.hash160(new Buffer(input, "utf8")).toString('hex')
    return hash
  }

  ll.encrypt = function (secret, text) {
    affirm(secret, "Can't encrypt without a key")
    affirm(text, "No plaintext provided for encryption")

    var cipher  = crypto.createCipher("aes-256-ctr", secret)
    var crypted = cipher.update(text, 'utf8', 'base64')
    crypted += cipher.final('base64');
    return crypted;
  }

  ll.decrypt = function (secret, text) {
    affirm(secret, "Can't decrypt without a key")
    affirm(text, "No plaintext provided for decryption")

    var decipher = crypto.createDecipher("aes-256-ctr", secret)
    var dec      = decipher.update(text, 'base64', 'utf8')
    dec += decipher.final('utf8');
    return dec;
  }

  ll.getAuthorization = function (userId, secret, method, uri, body, nonce) {
    affirm(userId, 'Need userId to generate authorization token')

    if (!secret) return 'HMAC ' + userId
    var message = JSON.stringify({ method: method, uri: uri, body: body, nonce: nonce })
    var hmac    = crypto.createHmac('sha256', new Buffer(secret, 'hex'))
    hmac.update(message)
    return 'HMAC ' + userId + ":" + hmac.digest('hex')
  }

  ll.authenticate = function(user, auth, method, uri, body, nonce, receivedTime, nonceLatencyTolerance) {
    ll.authenticateHMAC(user, auth, method, uri, body, nonce)
    ll.validateNonce(receivedTime, nonce, nonceLatencyTolerance)
  }

  ll.authenticateHMAC = function (user, auth, method, uri, body, nonce) {
    affirm(user && auth && auth.startsWith("HMAC "), badSignature(auth), 401)
    var authorization = ll.getAuthorization(user.userid, user.secret, method, uri, body, nonce)
    affirm(authorization === auth, badSignature(auth, 'Authentication failed. HMAC mismatch'), 401)
  }

  ll.validateNonce = function (receivedTime, nonce, nonceLatencyTolerance) {
    affirm(nonce && !isNaN(nonce), 'Authentication failed. Invalid Nonce ' + nonce, 401)
    affirm(!nonceLatencyTolerance || typeof nonceLatencyTolerance === 'number', 'Nonce tolerance should be numeric: ' + nonceLatencyTolerance)

    var diff                   = receivedTime - nonce
    var nonceWithInGracePeriod = Math.abs(receivedTime - nonce) <= (nonceLatencyTolerance || defaultLatencyTolerance) * 1000
    affirm(nonceWithInGracePeriod, 'Authentication failed. Nonce ' + nonce + ' stale by ' + diff + 'ms', 401)
  }

  function badSignature(auth, err) {
    return (err || 'HMAC authentication needed') + ' ' + auth
  }

  return ll
})()
