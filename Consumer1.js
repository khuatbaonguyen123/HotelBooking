const { Kafka } = require("kafkajs");
const clientES = require("./SearchEngine"); // Import OpenSearch client
const db = require("./database");

// Kafka configuration
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:29092"],
});

const consumer = kafka.consumer({ groupId: "test-group2" });

function dateFormatting(dateType) {
  let date = dateType.getDate();
  let month = dateType.getMonth() + 1;
  let year = dateType.getFullYear();
  const dateFormat = [
    year,
    (month > 9 ? "" : "0") + month,
    (date > 9 ? "" : "0") + date,
  ].join("/");
  return dateFormat;
}

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "dbserver1.bookingapp.room_reserved",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        // Parse the message value as JSON
        if (message.value !== null) {
          const messagePayload = JSON.parse(message.value.toString());
          const { payload } = messagePayload;
          console.log("Payload:", payload);
          const op = payload.op;

          if (op === "c" || op === "u") {
            const idData = payload.after.reservation_id;

            let response1;
            try {
              // Lấy dữ liệu từ CSDL với giới hạn số lượng mục và vị trí bắt đầu
              response1 = await new Promise((resolve, reject) => {
                db.query(
                  `SELECT * FROM vReservation WHERE id = ${idData}`,
                  (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                  }
                );
              });
            } catch (error) {
              console.log(error);
              throw new Error("Error fetching data from database");
            }

            let userReservation = [];
            // Xử lý dữ liệu nhận được từ CSDL
            response1.forEach((element, index, arr) => {
              var booking = {
                id: element.id,
                booker_id: element.booker_id,
                name: element.name,
                phone: element.phone,
                date_in: dateFormatting(element.date_in),
                date_out: dateFormatting(element.date_out),
                description: [element.number], // Khởi tạo mảng chứa description
                status: element.status,
                price: element.total_price,
                payment_date: dateFormatting(element.payment_date),
              };

              // Gom nhóm description theo cùng một booking id
              if (index > 0 && element.id === arr[index - 1].id) {
                userReservation[userReservation.length - 1].description.push(
                  element.number
                );
              } else {
                userReservation.push(booking);
              }
            });

            var newData = {
              id: userReservation[0].id,
              booker_id: userReservation[0].booker_id,
              name: userReservation[0].name,
              date_in: userReservation[0].date_in,
              date_out: userReservation[0].date_out,
              description: userReservation[0].description,
              status: userReservation[0].status,
              price: userReservation[0].price,
              payment_date: userReservation[0].payment_date
            };
            await clientES.index({
              index: "bookingapp",
              id: payload.after.reservation_id,
              body: newData,
              refresh: true,
            });
            console.log(
              `Upserted document with id ${payload.after.reservation_id}`
            );
          } else if (op === "d" && payload.before) {
            const idData = payload.before.reservation_id;
            await clientES.delete({
              index: "bookingapp",
              id: idData,
            });
            console.log(`Deleted document with id ${idData}`);
          }
        } else {
          console.log("Received null message");
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },
  });
};

run().catch(console.error);

// Gracefully close consumer on exit
process.on("SIGINT", async () => {
  await consumer.disconnect();
  process.exit();
});
