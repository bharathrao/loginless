# loginless

## install 

```
npm install socket.io-client loginless --save
```

## usage

```javascript
// create socket to be used by loginless module.
var socket = require("socket.io-client")("https://server-url", { rejectUnauthorized: true })

// loginless instance
var loginless = require("loginless")("https://server-url", "/api/auth/", 'livenet', util.log.bind(util))

// create a user (private key is used to generate public key and shared secret, but is neber send to server)
loginless.createServerKey(tradingAddress.privateKey, registrationMessage).then(function(resverResponse){
    /*server response example
        {"userid":"15vYTEVDwb1ksbiWyV35hc2eZdPrMvKrgD","serverPublicKey":"03a50742970ff626016ed86a3572e7d57c9efbe635a3db3e9752cbb3b55ceefcf1"} 
    */
})  

//login to server.
loginless.getServerKey(privKey).then(function(serverResponse){
   /*server response example
    {"userid":"15vYTEVDwb1ksbiWyV35hc2eZdPrMvKrgD","serverPublicKey":"03a50742970ff626016ed86a3572e7d57c9efbe635a3db3e9752cbb3b55ceefcf1"} 
   */
 })
 
```

