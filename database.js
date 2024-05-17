const mysql = require("mysql2");
const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  port: 5001,
  password: "root", /// thay doi password
  database: "bookingapp", // ghi ten database cua minh vao
});

db.getConnection((err) => {
  if (!err) console.log("Connect successfully");
  else console.log(err);
});

module.exports = db;
