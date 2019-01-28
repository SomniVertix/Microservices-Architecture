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

function clientConfig(){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('./certs/ca.crt'), 
    fs.readFileSync('./certs/client.key'), 
    fs.readFileSync('./certs/client.crt')
  );
  var client = new basic_proto.Basic(
    'localhost:50051',
    credentials
  );
  return client;
}

function main() {
  const gClient = clientConfig();

  dataRequestObject = {name: 'Eric', age: 21};

  gClient.printData(dataRequestObject, function(err, response) {
    console.log('Message for ', response.message);
  });
}

main();



// Useful Links
/**
 * https://github.com/grpc/grpc/issues/9210
 * https://github.com/grpc/grpc/issues/9210
 * 
 */