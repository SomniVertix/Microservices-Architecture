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
function ServiceOneGRPCClient(address, port){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );
  

  // Fix for using localhost generated keys in non-localhost applications
  // As seen here -> https://github.com/grpc/grpc/issues/6722
  var options = {
    'grpc.ssl_target_name_override' : "localhost",
    'grpc.default_authority': "localhost"
  };
  
  var fullAddress = address + ":" + port
  var client = new service_one_proto.ServiceOne(
    fullAddress, 
    credentials,
    options
    //grpc.credentials.createInsecure() // In case you wanted to try it without creds
  );
  return client;
}

function ServiceTwoGRPCClient(address, port){
  const credentials = grpc.credentials.createSsl(
    fs.readFileSync('../certs/ca.crt'), 
    fs.readFileSync('../certs/client.key'), 
    fs.readFileSync('../certs/client.crt')
  );

  var options = {
    'grpc.ssl_target_name_override' : "localhost",
    'grpc.default_authority': "localhost"
  };

  var fullAddress = "https://" + address + ":" + port
  var client = new service_two_proto.ServiceTwo(
    fullAddress,
    // credentials
    grpc.credentials.createInsecure() // In case you wanted to try it without creds
  );
  return client;
}
//#endregion


//#region Consul Config
const consul = require('consul')({
  "host": process.env.consulhost,
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
    let endpoint = "http://" +process.env.vaulthost + ":" + 8200;
    var options = {
      endpoint: endpoint,
      token: result.Value
    }
  
    var vault = require("node-vault")(options);
    vault.read("database/creds/app").then( (res) => {
      // console.log("Database User: " + res.data.username)
      // console.log("Database User: " + res.data.password)

      var mysql = require("mysql");
      var con = mysql.createConnection({
        host: process.env.dbhost,
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
  
  consul.catalog.service.nodes('GRPC Server One', function(err, result) {
   if (err) throw err;

   const serviceOneClient = ServiceOneGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
   dataRequestObject = {name: 'Bryan'}
   serviceOneClient.printData(dataRequestObject, function(err, response) {
     console.log("RESPONSE:", response);
   });
  });

  consul.catalog.service.nodes('GRPC Server Two', function(err, result) {
    if (err) throw err;
    const serviceTwoClient = ServiceTwoGRPCClient(result[0].ServiceAddress,result[0].ServicePort );
    dataRequestObject = {name: 'Eric'}
    serviceTwoClient.GetData(dataRequestObject, function(err, response) {
      console.log("RESPONSE:", response.message);
    });
  });

  retrieveVaultToken();
}

main();
