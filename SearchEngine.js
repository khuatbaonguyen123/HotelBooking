const { Client } = require('@elastic/elasticsearch');
const clientES = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'Thao12092004#'
  }
})
module.exports = clientES;