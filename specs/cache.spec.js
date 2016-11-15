var expect = require('expect.js')
var sinon  = require('sinon')
var Cache  = require("../src/cache.core")
var nodeUUID = require('node-uuid')
var clock

describe('cache tests', function () {
  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
  })

  it('set get and delete', function () {
    var cache = Cache()
    var input = "some data"
    var uuid = nodeUUID.v4()
    cache.put(uuid,input)
    expect(cache.get(uuid)).to.be.eql(input)
    expect(cache.get(uuid)).to.be.eql(undefined)
  })

  it('set and wait for expiry', function () {
    var cache = Cache()
    var input = "some data"
    var uuid = nodeUUID.v4()
    cache.put(uuid, input)
    clock.tick(240000)
    // clock.tick(120000)
    expect(cache.get(uuid)).to.be.eql(undefined)
  })

  it('multiple expiry', function(){
    var cache = Cache()
    var input = "some data"
    var uuids = []
    for (var i = 0; i < 10; i++) {
      var uuid = nodeUUID.v4()
      cache.put(uuid, input)
      uuids.push(uuid)
    }
    clock.tick(240000)
    uuids.forEach(uuid=>expect(cache.get(uuid)).to.be.eql(undefined))
  })
})