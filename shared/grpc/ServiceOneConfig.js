const PROTO_PATH = './shared/grpc/ServiceOne.proto';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const service_one_proto = grpc.loadPackageDefinition(packageDefinition).serviceOne;

module.exports = service_one_proto;
