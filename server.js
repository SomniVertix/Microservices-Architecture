// gRPC Config
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

function printData(call, callback) {
  console.info('Calling method [printData]');
  callback(null, {message: call.request.name, age: call.request.age} /* Data Reply Object */);
}

function serverConfig (){
  var server = new grpc.Server();

  server.addService(basic_proto.Basic.service, {printData: printData});

  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('./certs/ca.crt'), [{
    cert_chain: fs.readFileSync('./certs/server.crt'),
    private_key: fs.readFileSync('./certs/server.key')
  }], true);

  server.bind(`localhost:50051`, credentials);
  server.start();
  return server;
}

function main() {
  const server = serverConfig();
  console.log('Server Running . . . ');
}

main();

exports.printData = printData;