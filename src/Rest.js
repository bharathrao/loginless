module.exports = function (baseuri, loginless, nonce, crypto) {
  var REST      = {}
  var restjs    = require('rest.js')
  var methodMap = {
    GET    : restjs.get,
    POST   : restjs.post,
    DELETE : restjs.del,
    PUT    : restjs.put,
    OPTIONS: restjs.options
  }

  REST.beforeSend = function (method, url, data) {
    var reqNonce = nonce.getNonce()
    var account  = loginless.getAccount()
    var auth     = crypto.getAuthorization(account.userid, account.secret, method, url, data, reqNonce)
    return {
      "content-type" : "application/json",
      "nonce"        : reqNonce,
      "Authorization": auth
    }
  }

  // /api/order
  // https://test.coinpit.io/api/order
  // https://testinsight.coinp.it/insight-api/tx/7012ueio21e02eio21ue9
  function rest(method, url, data, beforeSend, retry) {
    beforeSend  = beforeSend || REST.beforeSend
    var headers = beforeSend(method, url, data)
    var current = Date.now()
    return methodMap[method](baseuri + url, headers, data)
      .then(function (result) {
        nonce.calibrateREST(restjs.getHeaderValue(result.headers, 'request-received'), current, method, url)
        return result.body
      })
      .catch(function (e) {
        if (e.statusCode === 401 && !retry) {
          return handleNonceErrorWithOPTIONS(method, url, data, beforeSend)
        } else {
          throw e
        }
      })
  }

  function handleNonceErrorWithOPTIONS(method, url, data, beforeSend) {
    return rest("OPTIONS", url, undefined, beforeSend).then(function () {
      beforeSend.nonce = nonce.getNonce()
      return rest(method, url, data, beforeSend, true)
    })
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
}
