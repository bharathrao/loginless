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

  function rest(method, url, headers, data, beforeSend, retry) {
    beforeSend  = beforeSend || REST.beforeSend
    var updated = concat(headers, beforeSend(method, url, data))
    return methodMap[method](baseuri + url, updated, data)
      .then(function (result) {
        nonce.calibrateREST(Date.now(), restjs.getHeaderValue(result.headers, 'server-time'), method, url)
        return result.body
      })
      .catch(function (e) {
        if ((e.statusCode === 401 || e.status === 401) && !retry) {
          return handleNonceErrorWithOPTIONS(method, url, headers, data, beforeSend)
        } else {
          throw e
        }
      })
  }

  function concat(headers, loginlessHeaders) {
    headers          = headers || {}
    loginlessHeaders = loginlessHeaders || {}
    Object.keys(headers).forEach(function (key) {
      loginlessHeaders[key] = headers[key]
    })
    return loginlessHeaders
  }

  function handleNonceErrorWithOPTIONS(method, url, headers, data, beforeSend) {
    return rest("OPTIONS", url, headers, undefined, beforeSend).then(function () {
      return rest(method, url, headers, data, beforeSend, true)
    })
  }

  REST.post = function (url, headers, data, beforeSend) {
    return rest("POST", url, headers, data, beforeSend)
  }

  REST.put = function (url, headers, data, beforeSend) {
    return rest("PUT", url, headers, data, beforeSend)
  }

  REST.get = function (url, headers, beforeSend) {
    return rest("GET", url, headers, undefined, beforeSend)
  }

  REST.del = function (url, headers, beforeSend) {
    return rest("DELETE", url, headers, undefined, beforeSend)
  }

  return REST
}
