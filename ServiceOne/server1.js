const CONSUL_HOST = process.env.consulhost
const GRPC_PORT = 8000

//#region gRPC Config
var PROTO_PATH = '../proto/ServiceOne.proto';
var grpc = require('grpc');
var fs = require('fs');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
var service_one_proto = grpc.loadPackageDefinition(packageDefinition).serviceOne;

// API Functions
function printData(call, callback) {
  console.log("Request Recieved From:", call.request.name);
  callback(null, { message: "I am a response from Server One" } /* DataReply Object */);
}

// Server config options
function ServiceOneGRPCServer() {
  var server = new grpc.Server();

  server.addService(service_one_proto.ServiceOne.service, { printData: printData });

  // let credentials = grpc.ServerCredentials.createSsl(
  //   fs.readFileSync('../certs/cert.pem'), [{
  //     cert_chain: fs.readFileSync('../certs/ca.pem'),
  //     private_key: fs.readFileSync('../certs/key.pem')
  //   }], false);

  let address = process.env.serviceOne + ":" + GRPC_PORT
  server.bind(
    address,
    // credentials
    grpc.ServerCredentials.createInsecure() // In case you wanted to try it without creds
  );
  server.start();
  return server;
}

//#endregion


//#region Consul Config
const consul = require('consul')({
  "host": CONSUL_HOST,
  "port": 8500, // whatever port consul is running on
  "secure": false
});
//#endregion


function main() {
  const server = ServiceOneGRPCServer();

  let details = {
    name: 'GRPC Server One',
    address: process.env.serviceOne,
    port: GRPC_PORT,
    id: "S1"
  };

  consul.agent.service.register(details, (err, xyz) => {
    if (err) throw err;
    console.log(details.name, 'registered with Consul at', details.address);
  });

  console.log('Server 1 Running . . . ');
}



main();

