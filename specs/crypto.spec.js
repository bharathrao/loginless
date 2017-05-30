var crypto       = require('../src/crypto')
var expect   = require('expect.js')
var fixtures = require('fixtures.js')(__filename)

describe('Crypto', function () {
  it('hash160', function () {
    fixtures.hash160.forEach(function (test, i) {
      var hash160 = crypto.hash160(test.publicKey + test.privateKey + test.time)
      expect(hash160).to.be.eql(test.result)
    })
  })

  it('Peers should arrive at shared secret', function () {
    fixtures.sharedSecret.forEach(function (test, i) {
      var shared1 = crypto.getSharedSecret(test.privateKey1, test.publicKey2, 'testnet')
      var shared2 = crypto.getSharedSecret(test.privateKey2, test.publicKey1, 'testnet')
      expect(shared1).to.be.eql(test.result)
      expect(shared2).to.be.eql(test.result)
    })
  })

  it('Authorization header computation', function () {
    fixtures.auth.forEach(function (test, i) {
      var auth = crypto.getAuthorization(test.userId, test.secret, test.method, test.uri, test.body, test.nonce)
      expect(auth).to.be.eql(test.result)
    })
  })

  it('Decrypt should reverse encrypt', function() {
    fixtures.encrypt.forEach(function(test, i) {
      var encrypted = crypto.encrypt(test.secret, test.plain)
      var decrypted = crypto.decrypt(test.secret, encrypted)
      expect(test.cipher).to.equal(encrypted)
      expect(test.plain).to.be(decrypted)
      expect(test.plain).not.to.be(encrypted)
    })
  })

  it('Requests with proper Authorization should pass', function() {
    fixtures.auth.forEach(function(test, i) {
      crypto.authenticate({ userid: test.userId, secret: test.secret }, test.result, test.method, test.uri, test.body, test.nonce, test.received)
    })
  })

  it('Request with SIGN Authorization should pass', function() {
    var test = fixtures.authApikey
    crypto.authenticate({ userid: test.userId, apikey: test.apikey.apikey }, test.result, test.method, test.uri, test.body, test.nonce, test.received)
  })

  it('Should compute SIGN authorizations', function() {
    var test = fixtures.apikeySignature
    var auth = crypto.getAuthorization(test.userId, fixtures.apiKeys.secretKey, test.method, test.uri, test.body, test.nonce)
    expect(auth).to.eql(test.result)
  })

  it('Requests without Authorization should fail', function() {
    var test = fixtures.noauthfailure
    expect(crypto.authenticate).withArgs({ userid: test.userId, secret: test.apikey || test.secret}, test.result, test.method, test.uri, test.body, test.nonce, test.received).to.throwError()
  })

  it('Requests with improper Authorization should fail', function() {
    var test = fixtures.badauthfailure
    expect(crypto.authenticate).withArgs({ userid: test.userId, secret: test.secret}, test.result, test.method, test.uri, test.body, test.nonce, test.received).to.throwError()
  })

  it('Requests that are outside nonce tolerance should fail', function() {
    var test = fixtures.noncefailure
    expect(crypto.authenticate).withArgs({ userid: test.userId, secret: test.secret}, test.result, test.method, test.uri, test.body, test.nonce, test.received).to.throwError()
  })
})
