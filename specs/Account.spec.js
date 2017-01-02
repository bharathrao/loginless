var expect = require('expect.js')
var fixtures = require('fixtures.js')(__filename)
var Account = require('../src/Account')

describe('Account', function() {
  it('Should derive account object from peer info', function() {
    account1 = Account(fixtures.peer2.publicKey, fixtures.peer1.privateKey)
    expect(account1).to.eql(fixtures.account)
  })
})
