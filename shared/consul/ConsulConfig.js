const CONSUL_HOST = process.env.consulhost;
const Consul = require('consul')({
  "host": CONSUL_HOST,
  "port": 8500, // whatever port consul is running on
  "secure": false
});

module.exports = Consul;