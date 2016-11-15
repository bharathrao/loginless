module.exports = function () {
  var cache   = {}
  var map   = {}
  var cacheTimeout = 30 * 1000

  cache.put = function (uuid, data) {
    map[uuid] = { data: data, time: Date.now() }
  }

  cache.get = function (uuid) {
    var result = map[uuid]
    var data   = result ? result.data : undefined
    delete map[uuid]
    return data
  }

  cache.cleanUp = function () {
    var keys    = Object.keys(map)
    var current = Date.now()
    for (var i = 0; i < keys.length; i++) {
      var time = map[keys[i]].time;
      if (current - time > cacheTimeout) delete map[keys[i]]
    }
  }

  cache.reset = function () {
    map = {}
  }

  setInterval(cache.cleanUp.bind(cache), cacheTimeout)
  return cache
}
