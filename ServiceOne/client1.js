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
    'localhost:8500', // Replace this with consul
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
    'localhost:8500', // Replace this with consul
    credentials
    /* grpc.credentials.createInsecure() // In case you wanted to try it without creds */
  );
  return client;
}
//#endregion


//#region Consul Config
// const consul = require('consul')({
//   "host": "127.0.0.1",
//   "port": 8500,
//   "secure": false
// });
//#endregion


function retrieveVaultToken() {
  // Use consul to retrieve token from vault
  consul.kv.get('vaultLogin', function (err, result) {
    if (err) throw (err);
    
    console.log("Vault Login Token: " + result.Value) 

    // use vault token to connect to vault and get database creds
    var options = {
      token: result.Value
    }
  
    var vault = require("node-vault")(options);
    vault.read("database/creds/app").then( (res) => {
      console.log(res)
      console.log("Database User: " + res.data.username)
      console.log("Database User: " + res.data.password)

      console.log(process.env.dbhost)
      var mysql = require("mysql");
      var con = mysql.createConnection({
        host: "192.168.16.3",
        user: res.data.username,
        password: res.data.password
      });

      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
      });
    })
    .catch(console.error);


  })
}

function main() {
  //retrieveVaultToken();
  
  const serviceOneClient = ServiceOneGRPCClient();
  dataRequestObject = {name: 'Eric'};

  serviceOneClient.printData(dataRequestObject, function(err, response) {
    console.log("RESPONSE:", response.message);
  });
  
}

main();


// Useful Links
/**
 * https://github.com/grpc/grpc/issues/9210
 * https://github.com/grpc/grpc/issues/9210
 * 
 */