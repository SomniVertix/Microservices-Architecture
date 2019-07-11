const GRPC_PORT = 8000;
const SERVICE_HOST = process.env.serviceOne;

//#region gRPC Config
const grpc = require('grpc');
const fs = require('fs');
const service_one_proto = require("./shared/grpc/ServiceOneConfig");

// Pull in all api functions from /api/index.js
const {
  PrintData
} = require("./api")

// Consolidate all function mappings to pass into serverConfig
// If more functions needed, just separate with comma within the object
const serviceFunctions = {
  PrintData: PrintData
}

// Server config options
const credentials = grpc.ServerCredentials.createSsl(
  fs.readFileSync('../certs/ca.pem'), [{
    cert_chain: fs.readFileSync('../certs/cert.pem'),
    private_key: fs.readFileSync('../certs/key.pem')
  }], true);

const serverConfig = {
  gRPCService: service_one_proto.ServiceOne.service,
  ServiceFunctions: serviceFunctions,
  credentials: grpc.ServerCredentials.createInsecure() || credentials, // Choose secure or insecure as you please
  ServiceAddress: SERVICE_HOST + ":" + GRPC_PORT
}

const details = {
  name: 'GRPC Server One',
  address: SERVICE_HOST,
  port: GRPC_PORT,
  id: "S1"
};
//#endregion


//Consul Config
const consul = require("./shared/consul/ConsulConfig");


function main() {
  const server = require("./shared/grpc/ServerConfig")(serverConfig);
  server.start();

  consul.agent.service.register(details, (err, xyz) => {
    if (err) throw err;
    console.log(details.name, 'registered with Consul at', details.address);
  });

  console.log('Server 1 Running . . . ');
}



main();

