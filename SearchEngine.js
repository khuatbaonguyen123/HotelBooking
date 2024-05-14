const { Client } = require("@opensearch-project/opensearch");

const host = "localhost";
const protocol = "http";
const port = 9200;

const clientES = new Client({
  node: `${protocol}://${host}:${port}`
});

module.exports = clientES;
