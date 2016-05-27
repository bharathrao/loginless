var ll       = require('../src/crypto')
var expect   = require('expect.js')
var fixtures = require('fixtures.js')(__filename)

describe('loginless tests', function () {
  describe('hash160', function () {
    fixtures.hash160.forEach(function (test, i) {
      it(i + ' ' + test.result, function () {
        var hash160 = ll.hash160(test.publicKey + test.privateKey + test.time)
        expect(hash160).to.be.eql(test.result)
      })
    })
  })
  describe('shared secret', function () {
    fixtures.sharedSecret.forEach(function (test, i) {
      it(i + ' ' + test.result, function () {
        var shared = ll.getSharedSecret(test.privateKey1, test.publicKey2, 'testnet')
        expect(shared).to.be.eql(test.result)
        shared = ll.getSharedSecret(test.privateKey2, test.publicKey1, 'testnet')
        expect(shared).to.be.eql(test.result)
      })
    })
  })
  describe('get Authorization', function () {
    fixtures.auth.forEach(function (test, i) {
      it(i + ' ' + test.result, function () {
        var auth = ll.getAuthorization(test.userId, test.secret, test.method, test.uri, test.body, test.nonce)
        expect(auth).to.be.eql(test.result)
      })
    })
  })
})
