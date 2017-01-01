var expect = require('expect.js')
var restjs = require('rest.js')
var sinon = require('sinon')
var bluebird = require('bluebird')

describe('Loginless', function() {
  var serverPublicKey = {serverPublicKey: '020a5a3a6450924a5571dfa52d00dc3f8d9917030d93d6b166a5784461bfb1e276'}
  it('Should register with server and obtain public key', function() {
    sinon.stub(restjs, "post", function(uri, headers) {
      expect(headers.Authorization).to.be.ok()
      expect(headers.Nonce).to.be.ok()
      return bluebird.resolve({body: serverPublicKey})
    })
    var ll = require('../src/index')('http://localhost', '/auth', 'testnet')
    ll.createServerKey('cQhxRVxkBpTrwUHZmnv5M7ZvPcgp4cZ8csnenAfFLyoFgEVvN8yy', '{reg:true}').then(function(result) {
      expect(result).to.eql(serverPublicKey)
    })
  })

  it('Should obtain pre-registered key from server', function() {
    sinon.stub(restjs, "get", function(uri, headers) {
      expect(headers.Authorization).to.be.ok()
      expect(headers.Nonce).to.be.ok()
      return bluebird.resolve({body: serverPublicKey})
    })
    var ll = require('../src/index')('http://localhost', '/auth', 'testnet')
    ll.getServerKey('cQhxRVxkBpTrwUHZmnv5M7ZvPcgp4cZ8csnenAfFLyoFgEVvN8yy').then(function(result) {
      expect(result).to.eql(serverPublicKey)
    })
  })
})
