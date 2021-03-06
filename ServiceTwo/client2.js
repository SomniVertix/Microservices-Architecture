const CONSUL_HOST = process.env.consulhost
const VAULT_HOST = process.env.vaulthost
const DB_HOST = process.env.dbhost

//#region gRPC Config

// Service one and two's proto definitions
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

var SECOND_PROTO_PATH = '../proto/ServiceTwo.proto';
var second_packageDefinition = protoLoader.loadSync(
    SECOND_PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var service_two_proto = grpc.loadPackageDefinition(second_packageDefinition).serviceTwo;


// Client config options for each server
function ServiceOneGRPCClient(address, port){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );
  
  // Fix for using localhost generated keys in non-localhost applications
  // As seen here -> https://github.com/grpc/grpc/issues/6722
  var options = {
    'grpc.ssl_target_name_override' : "localhost",
    'grpc.default_authority': "localhost"
  };
  
  var fullAddress = address + ":" + port
  var client = new service_one_proto.ServiceOne(
    fullAddress, 
    credentials,
    options
    // grpc.credentials.createInsecure() // In case you wanted to try it without creds
  );
  return client;
}

function ServiceTwoGRPCClient(address, port){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );
  
  var options = {
    'grpc.ssl_target_name_override' : "localhost",
    'grpc.default_authority': "localhost"
  };
  
  var fullAddress = address + ":" + port
  var client = new service_two_proto.ServiceTwo(
    fullAddress,
    credentials,
    options
    // grpc.credentials.createInsecure() // In case you wanted to try it without creds
  );
  return client;
}
//#endregion

//#region Consul Config
const consul = require('consul')({
  "host": CONSUL_HOST,
  "port": 8500,
  "secure": false
});
//#endregion


function waitForServer(serverName){
  consul.catalog.service.nodes(serverName, function(err, result) {
    if (err) throw err;
    if (result != "undefined"){
      return false;
    }
  });
  return true;
}

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function main() {
  let serverOneName = 'GRPC Server One'
  let serverTwoName = 'GRPC Server Two' 
  let dataRequestObject = {name: 'Service 2 Client'} 



  // Server One Pings
  if (waitForServer(serverOneName)){
    msleep(5000);
  }
  consul.catalog.service.nodes(serverOneName, function(err, result) {
   if (err) throw err;
   const serviceOneClient = ServiceOneGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
   serviceOneClient.printData(dataRequestObject, function(err, response) {
     console.log("RESPONSE:", response.message);
   });
  });


  // Server Two Pings
  if (waitForServer(serverTwoName)){
    msleep(5000);
  }
  consul.catalog.service.nodes(serverTwoName, function(err, result) {
    if (err) throw err;
    const serviceTwoClient = ServiceTwoGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
    serviceTwoClient.GetData(dataRequestObject, function(err, response) {
      console.log("RESPONSE:", response.message);
    });
  });
}

main();
