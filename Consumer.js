const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
require('dotenv').config();
const Rating = require('./model_mongodb/dbmongo');
const clientES = require('./SearchEngine'); // Import OpenSearch client
const db = require("./database");

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a Kafka instance
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:29092']
});

const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'dbserver1.bookingapp.booker', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (message.value) {
          // Parse the message value as JSON
          const messagePayload = JSON.parse(message.value.toString());
          const { payload } = messagePayload;

          // Logging the operation type
          const op = payload.op;
          const userName = '${payload.after.first_name} ${payload.after.last_name}';
          console.log('Operation:', op);
          if (op === 'u' && payload.after) {
            db.query(`SELECT distinct (id) FROM bookingapp.vreservation where name= ${userName};`, async (err, result) => {
              for(let i = 0; i < result.length; i++) {
                const newData = {
                  doc: {
                    name: `${userName}`
                  }
                };
                const response = await clientES.update({
                  index: 'bookingapp',
                  id: result[i].id, // Ensure the correct ID is used
                  body: newData
                });
              }
            });
            console.log(`Updated document with name: ${userName}`);
          } else if (op === 'd' && payload.before) {
            const idToDelete = payload.before.id;
            const response = await clientES.delete({
              index: 'bookingapp',
              id: idToDelete,
            });
            console.log('Deleted from Elasticsearch:', response.body);
            await Rating.deleteMany({ idUser: idToDelete });
            console.log(`Deleted documents with id ${idToDelete} from MongoDB`);
          }
        } else {
          console.log('Received null or undefined message value');
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });
};

run().catch(console.error);

// Gracefully close consumer on exit
process.on('SIGINT', async () => {
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
    process.exit();
  } catch (error) {
    console.error('Error disconnecting Kafka consumer:', error);
    process.exit(1);
  }
});
