//#region gRPC Config
var PROTO_PATH = __dirname + '/basic.proto';
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
var basic_proto = grpc.loadPackageDefinition(packageDefinition).basic;
//#endregion

//#region Consul Config
const consul = require('consul')({
  "host": "127.0.0.1",
  "port": 8500,
  "secure": false
});
//#endregion

//#region Express Config
var express = require('express');
var app = express();
app.listen(8500, function (){
  let details = {
    name: 'www',
    address: "127.0.0.1",
    port: 8500,
    id: "CONSUL_ID"
  };
  consul.agent.self(function (err, members) {
    if (err) console.log(err);
    console.log('members -- %j', members);
  });

  // consul.agent.service.register(details, (err, xyz) => {
  //   if (err) {
  //     throw err;
  //   }
  //   console.log('registered with Consul');
  // });
});
//#endregion

//#region API Functions
function printData(call, callback) {
  console.info('Calling method [printData]');
  callback(null, {message: call.request.name, age: call.request.age} /* Data Reply Object */);
}
exports.printData = printData;
//#endregion


function gServerConfig (){
  var server = new grpc.Server();

  server.addService(basic_proto.Basic.service, {printData: printData});

  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('./certs/ca.crt'), [{
    cert_chain: fs.readFileSync('./certs/server.crt'),
    private_key: fs.readFileSync('./certs/server.key')
  }], true);

  server.bind(
    `127.0.0.1:8500`, 
    credentials
    /* grpc.ServerCredentials.createInsecure() */
    );
  server.start();
  return server;
}

function main() {
  const server = gServerConfig();

  console.log('Server Running . . . ');
}



main();

