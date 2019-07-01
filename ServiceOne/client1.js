const CONSUL_HOST = process.env.consulhost
const VAULT_HOST = process.env.vaulthost
const DB_HOST = process.env.dbhost

//#region gRPC Config
const grpc = require('grpc');
const fs = require('fs');

// Service one and two's proto definitions
const service_one_proto = require("./grpc/ServiceOneConfig")
const service_two_proto = require("./grpc/ServiceTwoConfig")

// Client config options for each server
function ServiceOneGRPCClient(address, port) {
  // const credentials = grpc.credentials.createSsl(
  //   fs.readFileSync('../certs/cert.pem'), 
  //   fs.readFileSync('../certs/key.pem'), 
  //   fs.readFileSync('../certs/ca.pem')
  // );

  // Fix for using localhost generated keys in non-localhost applications
  // As seen here -> https://github.com/grpc/grpc/issues/6722
  const options = {
    'grpc.ssl_target_name_override': "localhost",
    'grpc.default_authority': "localhost"
  };

  const fullAddress = address + ":" + port
  const client = new service_one_proto.ServiceOne(
    fullAddress,
    // credentials,
    grpc.credentials.createInsecure(), // In case you wanted to try it without creds
    options
  );
  return client;
}

function ServiceTwoGRPCClient(address, port) {
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.pem'),
    fs.readFileSync('../certs/key.pem'),
    fs.readFileSync('../certs/cert.pem')
  );

  const options = {
    'grpc.ssl_target_name_override': "localhost",
    'grpc.default_authority': "localhost"
  };

  const fullAddress = address + ":" + port
  const client = new service_two_proto.ServiceTwo(
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
  "port": 8500, // to be replaced with environment variable telling where consul is
  "secure": false
});
//#endregion

function retrieveVaultToken() {
  // Use consul to retrieve token from vault
  consul.kv.get('appToken', function (err, result) {
    if (err) throw (err);
    // console.log(process.env.consulhost);
    // console.log("Vault Login Token: " + result.Value) 

    // use vault token to connect to vault and get database creds
    let endpoint = "http://" + VAULT_HOST + ":" + 8200;
    const options = {
      endpoint: endpoint,
      token: result.Value
    }

    const vault = require("node-vault")(options);
    vault.read("database/creds/app").then((res) => {
      // console.log("Database User: " + res.data.username)
      // console.log("Database User: " + res.data.password)

      const mysql = require("mysql");
      const con = mysql.createConnection({
        host: DB_HOST,
        user: res.data.username,
        password: res.data.password
      });

      con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
      });
    })
      .catch(console.error);


  })
}

function waitForServer(serverName) {
  consul.catalog.service.nodes(serverName, function (err, result) {
    if (err) throw err;
    if (result != "undefined") {
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
  let dataRequestObject = { name: 'Service 1 Client' }


  // Server One Pings
  if (waitForServer(serverOneName)) {
    msleep(10000);
  }
  consul.catalog.service.nodes(serverOneName, function (err, result) {
    if (err) throw err;
    const serviceOneClient = ServiceOneGRPCClient(result[0].ServiceAddress, result[0].ServicePort);
    console.log("Client 1 pinging", result[0].ServiceAddress, ":", result[0].ServicePort)
    serviceOneClient.printData(dataRequestObject, function (err, response) {
      console.log("RESPONSE:", response.message);
    });
  });


  // // Server Two Pings
  // if (waitForServer(serverTwoName)) {
  //   msleep(5000);
  // }
  // consul.catalog.service.nodes(serverTwoName, function (err, result) {
  //   if (err) throw err;
  //   console.log(result[0].ServiceAddress, result[0].ServicePort)
  //   const serviceTwoClient = ServiceTwoGRPCClient(result[0].ServiceAddress, result[0].ServicePort);
  //   serviceTwoClient.GetData(dataRequestObject, function (err, response) {
  //     console.log("RESPONSE:", response.message);
  //   });
  // });

  //retrieveVaultToken();
}

main();
