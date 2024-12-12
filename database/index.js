var mysql = require("mysql2");
const { isProduct } = require("../constants/isProduct");
var db_ssi;
var db_config = isProduct
  ? {
      host: "localhost",
      user: "admin",
      // password: "tmkITC98*",
      password: "123456",
      database: "ssi",
    }
  : {
      host: "localhost",
      user: "root",
      password: "123456",
      database: "ssi",
    };

function handleDisconnect() {
  db_ssi = mysql.createConnection(db_config);
  console.log("restart");
  db_ssi.connect(function (err) {
    console.log("Connection OK");
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }
    // Keep the connection alive
    setInterval(() => {
      db_ssi.query("SELECT 1", (err, results) => {
        if (err) {
          console.error("Error executing keep-alive query: ", err);
        } else {
          // console.log("Keep-alive query executed.");
        }
      });
    }, 30000); // Every 30 seconds
  });

  db_ssi.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      handleDisconnect();
      console.log("loi ket noi");
      // connnection idle timeout (the wait_timeout
      // throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

module.exports = db_ssi;
