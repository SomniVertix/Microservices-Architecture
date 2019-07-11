const SECOND_PROTO_PATH = './shared/grpc/ServiceTwo.proto';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const second_packageDefinition = protoLoader.loadSync(
    SECOND_PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const service_two_proto = grpc.loadPackageDefinition(second_packageDefinition).serviceTwo;

module.exports = service_two_proto;