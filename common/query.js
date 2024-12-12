const db_ssi = require("../database/index.js");

async function query(query, params = []) {
  try {
    let result = await db_ssi
      .promise()
      .query(query, params, function (error, results, fields) {
        if (error) throw error;
      });
    return result[0];
  } catch (error) {
    console.log("error: ", error);
  }
}

module.exports = query;
