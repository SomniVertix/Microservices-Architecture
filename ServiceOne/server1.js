//#region gRPC Config
var PROTO_PATH = '../proto/ServiceOne.proto';
var grpc = require('grpc');
var fs = require('fs');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var service_one_proto = grpc.loadPackageDefinition(packageDefinition).serviceOne;

// API Functions
function printData(call, callback) {
  console.log("Revieved request from:", call.request.name);
  callback(null, {message: "I am a response from Server One"} /* DataReply Object */);
}

// Server config options
function gServerConfig (){
  var server = new grpc.Server();

  server.addService(service_one_proto.ServiceOne.service, {printData: printData});

  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), [{
    cert_chain: fs.readFileSync('../certs/server.crt'),
    private_key: fs.readFileSync('../certs/server.key')
  }], true);

  server.bind(
    `localhost:8500`, 
    credentials
    /* grpc.ServerCredentials.createInsecure() // In case you wanted to try it without creds */
    );
  server.start();
  return server;
}

//#endregion

//#region ETC
//#region Consul Config
// const consul = require('consul')({
//   "host": "127.0.0.1",
//   "port": 8600,
//   "secure": false
// });
//#endregion

//#region Express Config
var express = require('express');
var app = express();
app.listen(8600, function (){
  // let details = {
  //   name: 'www',
  //   address: "127.0.0.1",
  //   port: 8600,
  //   id: "CONSUL_ID"
  // };
  // consul.agent.self(function (err, members) {
  //   if (err) console.log(err);
  //   console.log('members -- %j', members);
  // });

  // consul.agent.service.register(details, (err, xyz) => {
  //   if (err) {
  //     throw err;
  //   }
  //   console.log('registered with Consul');
  // });
});
//#endregion
//#endregion





function main() {
  const server = gServerConfig();

  console.log('Server 1 Running . . . ');
}



main();

