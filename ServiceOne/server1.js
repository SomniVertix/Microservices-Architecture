const GRPC_PORT = 8000;
const SERVICE_HOST = process.env.serviceOne;

//#region gRPC Config
const grpc = require('grpc');
const fs = require('fs');
const service_one_proto = require("./shared/grpc/ServiceOneConfig");


// API Functions *soon to be abstracted also*
function printData(call, callback) {
  console.log("Request Recieved From:", call.request.name);
  callback(null, { message: "I am a response from Server One" } /* DataReply Object */);
}

// If more functions needed, just separate with comma! :)
const serviceFunctions = {
  printData: printData
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
consul = require("./shared/consul/ConsulConfig");


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

