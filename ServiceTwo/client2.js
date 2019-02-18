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
function ServiceOneGRPCClient(){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );

  var client = new service_one_proto.ServiceOne(
    '127.0.0.1:8500', // Replace this with consul
    credentials
    /* grpc.credentials.createInsecure() // In case you wanted to try it without creds */
  );
  return client;
}

function ServiceTwoGRPCClient(){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );

  var client = new service_two_proto.ServiceTwo(
    'localhost:8550', // Replace this with consul
    credentials
    /*grpc.credentials.createInsecure() // In case you wanted to try it without creds */
  );
  return client;
}
//#endregion


function main() {
  
  const serviceTwoClient = ServiceTwoGRPCClient();
  dataRequestObject = {name: 'Bryan'};

  serviceTwoClient.GetData(dataRequestObject, function(err, response) {
    console.log('RESPONSE:', response.message);
  });
  
}

main();
