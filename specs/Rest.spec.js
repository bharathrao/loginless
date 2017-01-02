var expect   = require('expect.js')
var bluebird = require('bluebird')
var sinon    = require('sinon')
var restjs   = require('rest.js')
var Rest     = require('../src/Rest')
var Account  = require('../src/Account')
var nonce    = require('../src/nonce')

describe('Rest', function() {
  loginless = {}
  var account = Account('020a5a3a6450924a5571dfa52d00dc3f8d9917030d93d6b166a5784461bfb1e276',
                        'cQhxRVxkBpTrwUHZmnv5M7ZvPcgp4cZ8csnenAfFLyoFgEVvN8yy')

  it('should make call with Authorization and Nonce', function() {
    var stub1 = sinon.stub(restjs, "get", function(uri, headers) {
      expect(headers.Authorization).to.be.ok()
      expect(headers.Nonce).to.be.ok()
      return bluebird.resolve({body: true})
    })
    var rest = Rest("http://localhost", account)
    var spy = sinon.spy(nonce.calibrateREST)
    var stub2 = sinon.stub(nonce, 'calibrateREST', function() {
      spy(arguments)
    })
    rest.get("/").then(function() {
      expect(spy.called).to.be(true)
      stub1.restore()
      stub2.restore()
    })
  })

  it('should call OPTIONS method when encountering 401', function() {
    var first = true
    var opts = sinon.stub(restjs, "options", function(uri, headers) {
      return bluebird.resolve({ body: true})
    })
    var stub = sinon.stub(restjs, 'put', function(uri, headers) {
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
    var rest = Rest("http://localhost", account)
    rest.put("/").then(function(result) {
      expect(opts.called).to.be(true)
    })
    stub.restore()
  })
})
