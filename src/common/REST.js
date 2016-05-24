module.exports = (function () {
  var REST    = {}
  var isNode  = (typeof window == 'undefined')
  var request = isNode && require('request') // 60ms
  var bluebird = require('bluebird') // 170ms
  var m      = isNode && restServer || restBrowser
  var nonce  = require('./nonce')
  var assert = require('affirm.js')
  var extend = isNode && require('extend')

  function verbFunc(verb) {
    var method = verb === 'del' ? 'DELETE' : verb.toUpperCase()
    return function (uri, options, callback) {
      var params    = initParams(uri, options, callback)
      params.method = method
      return request(params, params.callback)
    }
  }

  // organize params for patch, post, put, head, del
  function initParams(uri, options, callback) {
    if (typeof options === 'function') {
      callback = options
    }

    var params = {}
    if (typeof options === 'object') {
      extend(params, options, { uri: uri })
    } else if (typeof uri === 'string') {
      extend(params, { uri: uri })
    } else {
      extend(params, uri)
    }

    params.callback = callback
    return params
  }

  request.options = verbFunc("options")

  var methodMap = isNode && {
      GET    : bluebird.promisify(request.get),
      POST   : bluebird.promisify(request.post),
      DELETE : bluebird.promisify(request.del),
      PUT    : bluebird.promisify(request.put),
      OPTIONS: bluebird.promisify(request.options)
    }

  REST.beforeSend = function () {
    return { "content-type": "application/json" }
  }

  // /api/order
  // https://test.coinpit.io/api/order
  // https://testinsight.coinp.it/insight-api/tx/7012ueio21e02eio21ue9
  function restBrowser(method, url, data, beforeSend, retry) {
    if (!isNode && !$) console.log('Running in browser requires JQuery')
    // bluebird.resolve enables us to add a .catch(), which $.ajax does not support
    beforeSend = beforeSend || REST.beforeSend
    var current;
    return bluebird.resolve(
      $.ajax(
        {
          url       : url,
          type      : method,
          data      : JSON.stringify(data),
          beforeSend: function (request) {
            current = Date.now()
            return setOnRequest(request, beforeSend(method, url, data))
          }
        }).then(function (result, status, headers) {
        nonce.calibrateREST(getHeaderValue(headers, 'request-received'), current, method, url)
        return result
      })).catch(function (err) {
      if (err.status === 401 && !retry) {
        return handleNonceErrorWithOPTIONS(method, url, data, beforeSend)
      } else {
        throw err
      }
    })
  }

  function handleNonceErrorWithOPTIONS(method, url, data, beforeSend) {
    return m("OPTIONS", url, undefined, beforeSend).then(function () {
      beforeSend.nonce = nonce.getNonce()
      return m(method, url, data, beforeSend, true)
    })
  }

  function setOnRequest(request, headers) {
    Object.keys(headers).forEach(function (key) {
      request.setRequestHeader(key, headers[key])
    })
  }

  function restServer(method, url, data, beforeSend, retry) {
    var requestSent = Date.now()
    var headers = beforeSend && beforeSend(method, url, data) || REST.beforeSend()
    var response    = methodMap[method]({ uri: url, json: data, headers: headers })
    return response.then(function (result) {
      var body = result[0] && result[0].body
      if (result[0].statusCode === 401 && !retry) {
        return handleNonceErrorWithOPTIONS(method, url, data, beforeSend)
      }
      assert(result[0].statusCode < 400, JSON.stringify(body), result[0].statusCode)
      nonce.calibrateREST(getHeaderValue(result[0].caseless, 'request-received'), requestSent, method, url)
      return (body && typeof body === 'string' && method != "OPTIONS") ? JSON.parse(body) : body
    })
  }

  function getHeaderValue(headers, field) {
    assert(field, 'Provide field name of header')
    if(!headers) return
    return headers.getResponseHeader ? headers.getResponseHeader(field) : headers.get(field)
  }

  function rest(method, url, data, beforeSend) {
    return m(method, url, data, beforeSend)
  }

  REST.post = function (url, data, beforeSend) {
    return rest("POST", url, data, beforeSend)
  }

  REST.put = function (url, data, beforeSend) {
    return rest("PUT", url, data, beforeSend)
  }

  REST.get = function (url, beforeSend) {
    return rest("GET", url, undefined, beforeSend)
  }

  REST.del = function (url, beforeSend) {
    return rest("DELETE", url, undefined, beforeSend)
  }

  return REST
})()
