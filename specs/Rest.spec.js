var expect   = require('expect.js')
var bluebird = require('bluebird')
var sinon    = require('sinon')
var restjs   = require('rest.js')
var Rest     = require('../src/Rest')
var Peer     = require('../src/Peer')
var nonce    = require('../src/nonce')('/')

describe('Rest', function() {
  loginless = {}
  loginless.getAccount = function() { return Peer('020a5a3a6450924a5571dfa52d00dc3f8d9917030d93d6b166a5784461bfb1e276').getAccount() }

  it('should make call with Authorization and Nonce', function() {
    var spy = sinon.spy(nonce.calibrateREST)
    sinon.stub(nonce, 'calibrateREST', function() {
      spy(arguments)
    })
    sinon.stub(restjs, "get", function(uri, headers) {
      expect(headers.Authorization).to.be.ok()
      expect(headers.Nonce).to.be.ok()
      return bluebird.resolve({body: true})
    })
    var rest = Rest("http://localhost", loginless, nonce, require('../src/crypto'))
    rest.get("/").then(function() {
      expect(spy.called).to.be(true)
    })
  })

  it('should call OPTIONS method when encountering 401', function() {
    var first = true
    var opts = sinon.stub(restjs, "options", function(uri, headers) {
      return bluebird.resolve({ body: true})
    })
    sinon.stub(restjs, 'put', function(uri, headers) {
      return new bluebird(function(resolve, reject) {
        if(first) {
          first = false
          var e = new Error()
          e.status = 401
          reject(e)
        } else {
          resolve({body: true})
        }
      })
    })
    var rest = Rest("http://localhost", loginless, nonce, require('../src/crypto'))
    rest.put("/").then(function(result) {
      expect(opts.called).to.be(true)
    })

  })
})
