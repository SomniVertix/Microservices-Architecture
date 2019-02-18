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
  console.log("Revieved request from:", call.request.name);
  callback(null, {message: "I am a response from Server One"} /* DataReply Object */);
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

  server.bind(
    `localhost:8550`, // Get this from Consul
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
  const server = ServiceTwoGRPCServer();

  console.log('Server 2 Running . . . ');
}



main();

