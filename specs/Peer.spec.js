var expect = require('expect.js')
var fixtures = require('fixtures.js')(__filename)
var Peer = require('../src/Peer')

describe('Peers should create common multisig', function() {
  var peer1 = new Peer(fixtures.peer1.publicKey, fixtures.network, fixtures.peer2.privateKey)
  var peer2 = new Peer(fixtures.peer2.publicKey, fixtures.network, fixtures.peer1.privateKey)

  it('Should have common multisig, redeem script and shared secret', function() {
    expect(peer1.accountid).to.be.ok()
    expect(peer1.secret).to.be.ok()
    expect(peer1.redeem).to.be.ok()
    expect(peer1.accountid).to.equal(peer2.accountid)
    expect(peer1.secret).to.equal(peer2.secret)
    expect(peer1.redeem).to.equal(peer2.redeem)
  })

  it('Should derive account object from peer info', function() {
    account1 = peer1.getAccount()
    expect(account1.userPrivateKey).to.be.ok()
    expect(account1.userPublicKey).to.be.ok()
    expect(account1.userid).to.be.ok()

    expect(account1.serverPublicKey).to.be.ok()
    expect(account1.serverAddress).to.be.ok()

    expect(account1.accountid).to.be.ok()
    expect(account1.redeem).to.be.ok()
    expect(account1.secret).to.be.ok()

  })
})
