var grpc = require('grpc');

const ServerConfiguration = (serverConfig) => {
    const server = new grpc.Server();

    server.addService(serverConfig.gRPCService, serverConfig.ServiceFunctions);

    server.bind(
        serverConfig.ServiceAddress,
        serverConfig.credentials
    );
    return server;
}

// TODO: Add error handling for missing parameters
module.exports = ServerConfiguration;