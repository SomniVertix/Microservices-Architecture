const CONSUL_HOST = process.env.consulhost

//#region gRPC Config
var SECOND_PROTO_PATH = '../proto/ServiceTwo.proto';
var grpc = require('grpc');
var fs = require('fs');
var protoLoader = require('@grpc/proto-loader');
var second_packageDefinition = protoLoader.loadSync(
    SECOND_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var service_two_proto = grpc.loadPackageDefinition(second_packageDefinition).serviceTwo;

// API Functions
function GetData (call, callback){
  console.log("Request from:", call.request.name);
  callback(null, {message: "I am a response from Server Two"} );
}

// Server config options
function ServiceTwoGRPCServer (){
  var server = new grpc.Server();

  server.addService(service_two_proto.ServiceTwo.service, {GetData: GetData});

  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), [{
    cert_chain: fs.readFileSync('../certs/server.crt'),
    private_key: fs.readFileSync('../certs/server.key')
  }], true);

  let address = process.env.serviceTwo + ":" + 9000
  server.bind(
    address, 
    credentials
    // grpc.ServerCredentials.createInsecure() // In case you wanted to try it without creds 
    );
  server.start();
  return server;
}

//#endregion


//#region Consul Config
const consul = require('consul')({
  "host": CONSUL_HOST,
  "port": 8500,
  "secure": false
});
//#endregion


//#region Express Config
var express = require('express');
var app = express();
app.listen(9100, function (){
  let details = {
    name: 'GRPC Server Two',
    address: process.env.serviceTwo,
    port: 9000,
    id: "S2"
  };

  consul.agent.service.register(details, (err, xyz) => {
    if (err) throw err;
    console.log(details.name, 'registered with Consul');
  });
});
//#endregion

function main() {
  const server = ServiceTwoGRPCServer();

  console.log('Server 2 Running . . . ');
}



main();

