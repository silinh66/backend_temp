var mysql = require("mysql2");
const { isProduct } = require("../constants/isProduct");

var db_config = isProduct
  ? {
      host: "localhost",
      user: "admin",
      password: "123456",
      database: "ssi",
      waitForConnections: true,
      connectionLimit: 10, // Adjust as needed
      queueLimit: 0,
    }
  : {
      host: "localhost",
      user: "root",
      password: "123456",
      database: "ssi",
      waitForConnections: true,
      connectionLimit: 10, // Adjust as needed
      queueLimit: 0,
    };

const pool = mysql.createPool(db_config);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Database connection established.");
  connection.release(); // Release the connection back to the pool
});

module.exports = pool;
