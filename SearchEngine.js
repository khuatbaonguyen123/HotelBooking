var host = "localhost";
var protocol = "http";
var port = 9200;

// Create a client
var { Client } = require("@opensearch-project/opensearch");
var clientES = new Client({
  node: protocol + "://" + host + ":" + port
});
module.exports = clientES;