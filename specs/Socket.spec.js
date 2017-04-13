var expect = require('expect.js')
var Socket = require('../src/Socket')
var nonce  = require('../src/nonce')
var Account   = require('../src/Account')
var sinon  = require('sinon')
var io     = require('socket.io-client')

describe('Loginless Socket', function() {
  loginless = {}
  var account = Account('020a5a3a6450924a5571dfa52d00dc3f8d9917030d93d6b166a5784461bfb1e276', 'cQhxRVxkBpTrwUHZmnv5M7ZvPcgp4cZ8csnenAfFLyoFgEVvN8yy')
  var socket = Socket("http://localhost", account)

  it('should send message with authorization headers', function() {
    var stub = sinon.stub(socket, 'emit', function(topic, message) {
      expect(message.headers.Authorization).to.be.ok()
      expect(message.headers.Nonce).to.be.ok()
    })
    socket.send({ method:'GET', uri: '/'})
    stub.restore()
  })

  it('should calibrate and re-send on socketError', function() {
    var auth
    var stub = sinon.stub(socket, 'emit', function(topic, message) {
      expect(auth = message.headers.Authorization).to.be.ok()
      expect(message.headers.Nonce).to.be.ok()
    })
    socket.send({ method:'GET', uri: '/'})
    socket.onAuthError({ data: { method: 'GET', uri: '/', retry: false, headers: { Authorization: auth } }})
    stub.restore()
  })

  it('should ignore invalid server message', function() {
    var auth
    var stub = sinon.stub(socket, 'emit', function(topic, message) {
      expect(auth = message.headers.Authorization).to.be.ok()
      expect(message.headers.Nonce).to.be.ok()
    })
    expect(socket.onAuthError).to.not.throwException()
    expect(socket.onAuthError.bind(socket, {})).to.not.throwException()
    expect(socket.onAuthError.bind(socket, {data:{}})).to.not.throwException()
    expect(socket.onAuthError.bind(socket, {data:{headers:{}}})).to.not.throwException()
    expect(socket.onAuthError.bind(socket, {data:{headers:{Authorization:true}}})).to.not.throwException()
    stub.restore()
  })

  it('should ignore expired/missing authentication errors', function() {

  })
})
