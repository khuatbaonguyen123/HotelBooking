const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
require('dotenv').config();
const Rating = require('./model_mongodb/dbmongo');


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
        // Parse the message value as JSON
        if(message !== null){
        const messagePayload = JSON.parse(message.value.toString());
        const { payload } = messagePayload;

        // console.log('Payload:', payload);
        console.log(payload['op']);
        const op = payload['op'];
        if (payload.op === 'd' && payload.before) {
          const idToDelete = payload.before.id;

          // Delete documents in MongoDB collection where id matches the extracted id
          await Message.deleteMany({ user_id: idToDelete });
          console.log(`Deleted documents with id ${idToDelete}`);
        }
        // console.log('Operation:', op);
        }else{
          console.log('Received null message');
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
  await consumer.disconnect();
  process.exit();
});
