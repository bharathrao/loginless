var expect = require('expect.js')
var fixtures = require('fixtures.js')(__filename)
var Peer = require('../src/Peer')
var Account = require('../src/Account')

describe('Peers should create common multisig', function() {
  var peer1 = new Peer(fixtures.peer1.publicKey, fixtures.peer2.privateKey)
  var peer2 = new Peer(fixtures.peer2.publicKey, fixtures.peer1.privateKey)

  it('Should have common multisig, redeem script and shared secret', function() {
    expect(peer1).to.eql(fixtures.account1)
    expect(peer2).to.eql(fixtures.account2)
    expect(peer1.accountid).to.equal(peer2.accountid)
    expect(peer1.secret).to.equal(peer2.secret)
    expect(peer1.redeem).to.equal(peer2.redeem)
  })

})
