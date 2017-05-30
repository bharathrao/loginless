var bitcoin    = require('bitcoinjs-lib')
var crypto     = require('crypto')
var affirm     = require('affirm.js')
var nacl       = require('tweetnacl')

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
    var authMethod = secret.length === 128 ? ll.getAuthorizationApiKey : ll.getAuthorizationHmac
    return authMethod(userId, secret, message)
  }

  ll.getAuthorizationHmac = function(userId, secret, message) {
    var hmac    = crypto.createHmac('sha256', new Buffer(secret, 'hex'))
    hmac.update(message)
    return 'HMAC ' + userId + ":" + hmac.digest('hex')
  }

  ll.getAuthorizationApiKey = function (userId, secret, message) {
    var keyPair = nacl.sign.keyPair.fromSecretKey(Buffer.from(secret, 'hex'))
    var keyName = Buffer.from(keyPair.publicKey).toString('hex').substring(0, 16)
    var signature = nacl.sign.detached(Buffer.from(message, 'utf8'), keyPair.secretKey)
    return 'SIGN ' + userId + "." + keyName + ":" + Buffer.from(signature).toString('base64')
  }

  ll.getAccountAuthorization = function(account, method, uri, body, nonce) {
    var message = JSON.stringify({ method: method, uri: uri, body: body, nonce: nonce })
    if(account.apikey) return ll.getAuthorizationApiKey(account.userid, account.apikey, message)
    if(account.secret) return ll.getAuthorizationHmac(account.userid, account.secret, message)
  }

  ll.authenticate = function(user, auth, method, uri, body, nonce, receivedTime, nonceLatencyTolerance) {
    var authParts = auth.split(' ')
    affirm(authParts[0], 'Expecting HMAC or SIGN Authorization')
    var authenticator = ll.authenticators[authParts[0]]
    affirm(authenticator, 'Unsupported Authorization method')
    authenticator(user, auth, method, uri, body, nonce)
    ll.validateNonce(receivedTime, nonce, nonceLatencyTolerance)
  }

  ll.authenticateHMAC = function (user, authHMAC, method, uri, body, nonce) {
    affirm(user && authHMAC && authHMAC.startsWith("HMAC "), badSignature(authHMAC), 401)
    var authorization = ll.getAuthorization(user.userid, user.secret, method, uri, body, nonce)
    affirm(authorization === authHMAC, badSignature(authHMAC, 'Authentication failed. HMAC mismatch'), 401)
  }

  ll.authenticateSIGN = function (user, authSIGN, method, uri, body, nonce) {
    affirm(user && authSIGN && authSIGN.startsWith("SIGN ") && (authSIGN.indexOf(':') > 0), badSignature(authSIGN, 'SIGN authentication needed'), 401)
    var message   = Buffer.from(JSON.stringify({ method: method, uri: uri, body: body, nonce: nonce }), 'utf8')
    var apikey    = Buffer.from(user.apikey, 'hex')
    var signature = Buffer.from(authSIGN.split(':')[1], 'base64')
    affirm(nacl.sign.detached.verify(message, signature, apikey), 'Authentication failed. SIGN mismatch')
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

  ll.authenticators = {
    'HMAC': ll.authenticateHMAC,
    'SIGN': ll.authenticateSIGN
  }


  return ll
})()
