var expect = require('expect.js')
var Nonce = require('../src/nonce')

describe('Nonce', function() {
  it('Nonce should use current time by default', function() {
    var nonce = Nonce()
    var now = Date.now()
    nonce.calibrateREST(now, now)
    var cur = nonce.getNonce()
    expect(cur).to.equal(now)
  })

  it('Nonce should use adjusted clock when clocks out of sync', function() {
    var nonce = Nonce()
    var now = Date.now()
    nonce.calibrateREST(now + 2000, now, 'PUT')
    var cur = nonce.getNonce()
    expect(cur - (now + 2000) < 100).to.be(true)
    now = Date.now()
    nonce.calibrateREST(now, now + 2000, 'PUT')
    cur = nonce.getNonce()
    expect(cur - (now - 2000) < 100).to.be(true)
  })
})
