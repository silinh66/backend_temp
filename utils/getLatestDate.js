const moment = require("moment");
const { default: axios } = require("axios");

async function getLatestDate() {
  let fromDate = moment().subtract(6, "days").format("DD/MM/YYYY");
  let toDate = moment().format("DD/MM/YYYY");
  let response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=VNM&fromDate=${fromDate}&toDate=${toDate}`
  );
  let listSymbol = response.data.data ? response.data.data.reverse() : [];
  let lastDate = listSymbol.length > 0 ? listSymbol[0].TradingDate : "";
  console.log("lastDate: ", lastDate);
  return lastDate;
}

module.exports = getLatestDate;
