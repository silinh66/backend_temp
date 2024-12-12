const axios = require("axios");
const query = require("./common/query");
const fs = require("fs");
const moment = require("moment");
let { groupDataByTime } = require("./convert");
const SMA = require("technicalindicators").SMA;
var RSI = require("technicalindicators").RSI;
const { Parser } = require("json2csv");

//call to http://localhost:3020/IntradayOhlc

async function getIntradayOhlc() {
  let listData = await query("SELECT symbol from data");
  for (let i = 0; i < listData.length; i++) {
    const { symbol } = listData[i];
    let fromDate = moment().subtract(30, "days").format("DD/MM/YYYY");
    let toDate = moment().format("DD/MM/YYYY");
    let response = await axios.get(
      `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
    );
    console.log(
      `stt: ${i}, symbol: ${symbol}, response: ${response.data.data.length}`
    );
    //delay 50ms
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
// getIntradayOhlc();

async function getDailyOhlc() {
  let listData = await query("SELECT symbol from data");
  for (let i = 0; i < listData.length; i++) {
    const { symbol } = listData[i];
    let fromDate = moment().subtract(30, "days").format("DD/MM/YYYY");
    let toDate = moment().format("DD/MM/YYYY");
    let response = await axios.get(
      `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
    );
    console.log(
      `stt: ${i}, symbol: ${symbol}, response: ${response.data.data.length}`
    );
    //delay 50ms
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// getDailyOhlc();

async function getVNMData() {
  let symbol = "VNM";
  let fromDate = moment().subtract(402, "days").format("DD/MM/YYYY");
  let toDate = moment().subtract(372, "days").format("DD/MM/YYYY");
  let response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  let listSymbol = response.data.data ? response.data.data.reverse() : [];
  fromDate = moment().subtract(371, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(341, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(340, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(310, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(309, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(279, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(278, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(248, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(247, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(217, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(216, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(186, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(185, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(155, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(154, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(124, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(123, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(93, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(92, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(62, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  fromDate = moment().subtract(61, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(31, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;

  fromDate = moment().subtract(30, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(0, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );

  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data.reverse()]
    : listSymbol;
  // fs.writeFileSync("dataLastDay.json", JSON.stringify(response.data.data));
  fs.writeFileSync("data1m.json", JSON.stringify(listSymbol));
  // listSymbol = groupDataByTime(listSymbol, "15m");
  // let bPrices = listSymbol
  //   ? listSymbol.map((item, index) => {
  //       return {
  //         symbol: symbol,
  //         date: item.TradingDate,
  //         time: item.Time,
  //         open: item.Open,
  //         high: item.High,
  //         low: item.Low,
  //         close: item.Close,
  //         volume: item.Volume,
  //       };
  //     })
  //   : [];
  // console.log("bPrices: ", bPrices);
  // let mapPrices = bPrices.map((item, index) => {
  //   return +item.close;
  // });
  // console.log("length: ", mapPrices.length);
  // // if (mapPrices[mapPrices.length - 1] === 0) {
  // //   mapPrices.pop();
  // // }

  // // console.log(`symbol: ${symbol}, mapPrices: ${mapPrices.length}`);
  // // console.log("mapPrices: ", mapPrices);
  // let high = bPrices.map((item, index) => {
  //   return +item.high;
  // });
  // let low = bPrices.map((item, index) => {
  //   return +item.low;
  // });
  // let close = bPrices.map((item, index) => {
  //   return +item.close;
  // });
  // let volume = bPrices.map((item, index) => {
  //   return +item.volume;
  // });
  // let sma10 = SMA.calculate({ period: 10, values: mapPrices });
  // let sma20 = SMA.calculate({ period: 20, values: mapPrices });
  // let sma50 = SMA.calculate({ period: 50, values: mapPrices });
  // let sma150 = SMA.calculate({ period: 150, values: mapPrices });
  // let sma200 = SMA.calculate({ period: 200, values: mapPrices });
  // // console.log("sma: ", sma);
  // let curSma10 = sma10[sma10.length - 1];
  // console.log("curSma10: ", curSma10);
  // let curSma20 = sma20[sma20.length - 1];
  // console.log("curSma20: ", curSma20);
  // let curSma50 = sma50[sma50.length - 1];
  // console.log("curSma50: ", curSma50);
  // let curSma150 = sma150[sma150.length - 1];
  // console.log("curSma150: ", curSma150);
  // let curSma200 = sma200[sma200.length - 1];
  // console.log("curSma200: ", curSma200);

  // //RSI
  // let rsi = RSI.calculate({ period: 14, values: mapPrices });
  // let curRSI = rsi[rsi.length - 1];
  // console.log("curRSI: ", curRSI);
  // console.log("mapPrices: ", mapPrices.reverse());
  // // fs.writeFileSync("mapPrice.txt", mapPrices.reverse().join("\n"));
  // console.log("rsi: ", rsi.reverse());
}

// getVNMData();

async function getListPair() {
  let listData = await query("SELECT symbol from data");
  let listDataMap = listData.map((item) => item.symbol);
  fs.writeFileSync("listData.json", JSON.stringify(listDataMap));
}
// getListPair();

async function getVNMDataDaily() {
  let symbol = "ACB";
  let fromDate = moment().subtract(402, "days").format("DD/MM/YYYY");
  let toDate = moment().subtract(372, "days").format("DD/MM/YYYY");
  let response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  let listSymbol = response.data.data ? response.data.data : [];
  fromDate = moment().subtract(371, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(341, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(340, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(310, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(309, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(279, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(278, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(248, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(247, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(217, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(216, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(186, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(185, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(155, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(154, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(124, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(123, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(93, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(92, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(62, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  fromDate = moment().subtract(61, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(31, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;

  fromDate = moment().subtract(30, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(0, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  listSymbol = response.data.data
    ? [...listSymbol, ...response.data.data]
    : listSymbol;
  // listSymbol = groupDataByTime(listSymbol, "2h");
  let bPrices = listSymbol
    ? listSymbol.map((item, index) => {
        return {
          symbol: symbol,
          date: item.TradingDate,
          time: item.Time,
          timestamp: moment(
            item.TradingDate + " " + item.Time,
            "DD/MM/YYYY HH:mm:ss"
          ).unix(),
          open: item.Open,
          high: item.High,
          low: item.Low,
          close: item.Close,
          volume: item.Volume,
        };
      })
    : [];
  console.log("bPrices: ", bPrices);

  // Fields to include in the CSV
  const fields = ["date", "open", "high", "low", "close"];

  // json2csv parser configuration
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(
    bPrices.map(({ timestamp, open, high, low, close }) => ({
      date: timestamp,
      open,
      high,
      low,
      close,
    }))
  );

  // Write the CSV to a file
  fs.writeFile("output.csv", csv, function (err) {
    if (err) throw err;
    console.log('CSV file successfully saved as "output.csv"');
  });
  // let mapPrices = bPrices.map((item, index) => {
  //   return +item.close;
  // });
  // console.log("length: ", mapPrices.length);
  // if (mapPrices[mapPrices.length - 1] === 0) {
  //   mapPrices.pop();
  // }

  // // console.log(`symbol: ${symbol}, mapPrices: ${mapPrices.length}`);
  // // console.log("mapPrices: ", mapPrices);
  // let high = bPrices.map((item, index) => {
  //   return +item.high;
  // });
  // let low = bPrices.map((item, index) => {
  //   return +item.low;
  // });
  // let close = bPrices.map((item, index) => {
  //   return +item.close;
  // });
  // let volume = bPrices.map((item, index) => {
  //   return +item.volume;
  // });
  // let sma10 = SMA.calculate({ period: 10, values: mapPrices });
  // let sma20 = SMA.calculate({ period: 20, values: mapPrices });
  // let sma50 = SMA.calculate({ period: 50, values: mapPrices });
  // let sma150 = SMA.calculate({ period: 150, values: mapPrices });
  // let sma200 = SMA.calculate({ period: 200, values: mapPrices });
  // // console.log("sma: ", sma);
  // let curSma10 = sma10[sma10.length - 1];
  // console.log("curSma10: ", curSma10);
  // let curSma20 = sma20[sma20.length - 1];
  // console.log("curSma20: ", curSma20);
  // let curSma50 = sma50[sma50.length - 1];
  // console.log("curSma50: ", curSma50);
  // let curSma150 = sma150[sma150.length - 1];
  // console.log("curSma150: ", curSma150);
  // let curSma200 = sma200[sma200.length - 1];
  // console.log("curSma200: ", curSma200);

  // //RSI
  // let rsi = RSI.calculate({ period: 14, values: mapPrices });
  // let curRSI = rsi[rsi.length - 1];
  // console.log("curRSI: ", curRSI);
  // console.log("mapPrices: ", mapPrices.reverse());
  // // fs.writeFileSync("mapPrice.txt", mapPrices.reverse().join("\n"));
  // console.log("rsi: ", rsi.reverse());
  // console.log("listSymbol: ", listSymbol.reverse().splice(0, 60));
}

getVNMDataDaily();

const getTodayPrice = async () => {
  const symbol = "AAA";
  fromDate = moment().subtract(1, "days").format("DD/MM/YYYY");
  toDate = moment().subtract(0, "days").format("DD/MM/YYYY");
  response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  console.log("response: ", response.data.data);
};
// getTodayPrice();
