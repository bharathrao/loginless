# loginless

## install 

```
npm install loginless --save
```

## usage

```javascript
// loginless instance
var loginless = require("loginless")("https://server-url", "/api/auth/")

// create a user (private key is used to generate public key and shared secret, but is neber send to server)
loginless.registerKey(tradingAddress.privateKey, registrationMessage).then(function(resverResponse){
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

 //Account information
 loginless.account

 //rest object to make rest calls
 loginless.rest

 //socket object
 loginless.socket
 
```

