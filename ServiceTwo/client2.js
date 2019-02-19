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
    credentials
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
    fullAddress, // Replace this with consul
    credentials
    // grpc.credentials.createInsecure() // In case you wanted to try it without creds
  );
  return client;
}
//#endregion

//#region Consul Config
const consul = require('consul')({
  "host": process.env.consulhost,
  "port": 8500,
  "secure": false
});
//#endregion


function main() {
  
  consul.catalog.service.nodes('GRPC Server One', function(err, result) {
    if (err) throw err;
    const serviceOneClient = ServiceOneGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
    dataRequestObject = {name: 'Bryan'}
    serviceOneClient.printData(dataRequestObject, function(err, response) {
      console.log("RESPONSE:", response.message);
    });
  });

  consul.catalog.service.nodes('GRPC Server Two', function(err, result) {
    if (err) throw err;
    const serviceTwoClient = ServiceTwoGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
    dataRequestObject = {name: 'Eric'}
    serviceTwoClient.GetData(dataRequestObject, function(err, response) {
      console.log("RESPONSE:", response.message);
    });
  });
  
}

main();
