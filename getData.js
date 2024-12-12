const moment = require("moment");
const { default: axios } = require("axios");
const fs = require("fs");
var cron = require("node-cron");
const boll = require("bollinger-bands");
const SMA = require("technicalindicators").SMA;
var BB = require("technicalindicators").BollingerBands;
var RSI = require("technicalindicators").RSI;
const EMA = require("technicalindicators").EMA;
const MFI = require("technicalindicators").MFI;
const ADX = require("technicalindicators").ADX;
const StochasticRSI = require("technicalindicators").StochasticRSI;
const Stochastic = require("technicalindicators").Stochastic;
const WilliamsR = require("technicalindicators").WilliamsR;
const MACD = require("technicalindicators").MACD;
const PSAR = require("technicalindicators").PSAR;
const ICHIMOKU = require("technicalindicators").IchimokuCloud;

const query = require("./common/query");

let rawConfig = fs.readFileSync("listConfig.json");
var listConfig = JSON.parse(rawConfig);

let listMatchRSIUp = [];
let listMatchRSIDown = [];

let listMatchMA = [];
let listMatchRSI = [];
let listMatchMACD = [];

cron.schedule("3 */5 * * * *", () => {
  console.log("running a task every 5 minutes", moment().format("HH:mm:ss"));
  // console.log("listMatchRSIUp", listMatchRSIUp);
  // console.log("listMatchRSIDown", listMatchRSIDown);
  // console.log('listMatchRSIUp.length', listMatchRSIUp.length);
  if (listMatchRSIUp.length > 0) {
    const groupList = groupBy(listMatchRSIUp, "time");
    // console.log("groupList: ", groupList);
    let resultString = "MATCHED RSI UP:";
    const listKey = Object.keys(groupList);
    for (let i = 0; i < listKey.length; i++) {
      if (groupList[listKey[i]].length > 0) {
        resultString += `\n---------------------${listKey[i]}---------------------`;
        // resultString += `\n${listKey[i]}:`;
        // console.log('groupList[listKey[i]]', groupList[listKey[i]]);
        for (let j = 0; j < groupList[listKey[i]].length; j++) {
          resultString += `\n ${groupList[listKey[i]][j].symbol}`;
        }
      }
    }
    console.log("resultString: ", resultString);

    // bot.sendMessage(
    //   chat_id[0],
    //   `${resultString}
    //           ${moment().add(5, "hours").format("HH:mm:ss")}`
    // );
  }
  if (listMatchRSIDown.length > 0) {
    const groupList = groupBy(listMatchRSIDown, "time");
    // console.log("groupList: ", groupList);
    let resultString = "MATCHED RSI DOWN:";
    const listKey = Object.keys(groupList);
    for (let i = 0; i < listKey.length; i++) {
      if (groupList[listKey[i]].length > 0) {
        resultString += `\n---------------------${listKey[i]}---------------------`;
        // resultString += `\n${listKey[i]}:`;
        // console.log('groupList[listKey[i]]', groupList[listKey[i]]);
        for (let j = 0; j < groupList[listKey[i]].length; j++) {
          resultString += `\n ${groupList[listKey[i]][j].symbol}`;
        }
      }
    }
    console.log("resultString: ", resultString);

    // bot.sendMessage(
    //   chat_id[1],
    //   `${resultString}
    //           ${moment().add(5, "hours").format("HH:mm:ss")}`
    // );
  }
  if (listMatchMA.length > 0) {
    const groupList = groupBy(listMatchMA, "time");
    // console.log("groupList: ", groupList);
    let resultString = "MATCHED MA:";
    const listKey = Object.keys(groupList);
    for (let i = 0; i < listKey.length; i++) {
      if (groupList[listKey[i]].length > 0) {
        resultString += `\n---------------------${listKey[i]}---------------------`;
        // resultString += `\n${listKey[i]}:`;
        // console.log('groupList[listKey[i]]', groupList[listKey[i]]);
        for (let j = 0; j < groupList[listKey[i]].length; j++) {
          resultString += `\n ${groupList[listKey[i]][j].symbol}`;
        }
      }
    }
    console.log("resultString: ", resultString);

    // bot.sendMessage(
    //   chat_id[0],
    //   `${resultString}
    //           ${moment().add(5, "hours").format("HH:mm:ss")}`
    // );
  }

  listMatchRSIUp = [];
  listMatchRSIDown = [];
  listMatchMA = [];
});
async function getIntradayOhlc() {
  let listData = await query("SELECT symbol from data");
  let interval = "5m";
  for (let i = 0; i < listData.length; i++) {
    try {
      let isStoch = false;
      let isRSI = false;
      let isRSIdown = false;
      let isMFI = false;
      let isDMI_ADX = false;
      let isMACD = false;
      let isEMA = false;
      let isWilliams = false;
      let isMA = false;
      let isRS = false;

      const { symbol } = listData[i];
      let fromDate = moment().subtract(403, "days").format("DD/MM/YYYY");
      let toDate = moment().subtract(373, "days").format("DD/MM/YYYY");
      let response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      let listSymbol = response.data.data ? response.data.data : [];
      fromDate = moment().subtract(372, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(342, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(341, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(311, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(310, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(280, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(279, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(249, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(248, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(218, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(217, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(187, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(186, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(156, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(155, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(125, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(124, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(94, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(93, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(63, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;
      fromDate = moment().subtract(62, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(32, "days").format("DD/MM/YYYY");
      response = await axios.get(
        `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data]
        : listSymbol;

      fromDate = moment().subtract(31, "days").format("DD/MM/YYYY");
      toDate = moment().subtract(1, "days").format("DD/MM/YYYY");
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
              open: item.Open,
              high: item.High,
              low: item.Low,
              close: item.Close,
              volume: item.Volume,
            };
          })
        : [];
      let mapPrices = bPrices.map((item, index) => {
        return +item.close;
      });
      // console.log("length: ", mapPrices.length);
      if (mapPrices[mapPrices.length - 1] === 0) {
        mapPrices.pop();
      }

      let high = bPrices.map((item, index) => {
        return +item.high;
      });
      let low = bPrices.map((item, index) => {
        return +item.low;
      });
      let close = bPrices.map((item, index) => {
        return +item.close;
      });
      let volume = bPrices.map((item, index) => {
        return +item.volume;
      });
      let sma10 = SMA.calculate({ period: 10, values: mapPrices });
      let sma20 = SMA.calculate({ period: 20, values: mapPrices });
      let sma50 = SMA.calculate({ period: 50, values: mapPrices });
      let sma150 = SMA.calculate({ period: 150, values: mapPrices });
      let sma200 = SMA.calculate({ period: 200, values: mapPrices });
      let curSma10 = sma10[sma10.length - 1];
      let curSma20 = sma20[sma20.length - 1];
      let curSma50 = sma50[sma50.length - 1];
      let curSma150 = sma150[sma150.length - 1];
      let curSma200 = sma200[sma200.length - 1];
      let lineSMA = `${moment().format(
        "HH:mm:ss"
      )}-${interval}-${symbol}-sma10:${JSON.stringify(
        curSma10
      )}- sma20:${JSON.stringify(curSma20)}- sma50:${JSON.stringify(
        curSma50
      )}- sma150:${JSON.stringify(curSma150)}- sma200:${JSON.stringify(
        curSma200
      )}\n`;
      fs.appendFileSync("SMA.txt", lineSMA);
      if (
        curSma10 > curSma20 &&
        curSma20 > curSma50 &&
        curSma50 > curSma150 &&
        curSma150 > curSma200
      ) {
        isMA = true;
      }

      //RSI
      let rsi = RSI.calculate({ period: 14, values: mapPrices });
      let curRSI = rsi[rsi.length - 1];
      // fs.writeFileSync("mapPrice.txt", mapPrices.reverse().join("\n"));
      // console.log("rsi: ", rsi.reverse());
      let lineRSI = `${moment().format(
        "HH:mm:ss"
      )}-${interval}-${symbol}-${JSON.stringify(curRSI)}\n`;
      fs.appendFileSync("RSI.txt", lineRSI);
      if ((curRSI > listConfig.RSIValue && listConfig.RSI) || !listConfig.RSI) {
        isRSI = true;
      }

      //MACD
      let macd = MACD.calculate({
        values: mapPrices,
        fastPeriod: 5,
        slowPeriod: 14,
        signalPeriod: 3,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      let curMACD = macd[macd.length - 1];
      let prevMACD = macd[macd.length - 2];
      let lineMACD = `${moment().format(
        "HH:mm:ss"
      )}-1m-${symbol}-curMACD:${JSON.stringify(
        curMACD
      )}-prevMACD:${JSON.stringify(prevMACD)}\n`;
      fs.appendFileSync("MACD.txt", lineMACD);
      if (
        (curMACD > listConfig.MACDValue &&
          prevMACD < curMACD &&
          listConfig.MACD) ||
        !listConfig.MACD
      ) {
        isMACD = true;
      }

      //Checking
      if (isMA) {
        listMatchMA.push({
          symbol: symbol,
          time: "1d",
        });
      }
      if (isRSI) {
        listMatchRSI.push({
          symbol: symbol,
          time: "1d",
        });
      }
      if (isMACD) {
        listMatchMACD.push({
          symbol: symbol,
          time: "1d",
        });
      }
      //delay 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      //continue
      continue;
    }
  }
}
async function startIntraday() {
  // while (true) {
  console.log("Start get new prices");
  await getIntradayOhlc();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
  // }
}

startIntraday();

async function startDaily() {
  while (true) {
    console.log("Start get new prices daily");
    console.time();
    await getDaily();
    console.log("End get new prices daily after");
    console.timeEnd();
    // //wait 15 minutes
    // await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 15));
  }
}

startDaily();

async function getDaily() {
  let listData = await query("SELECT symbol from data");
  let interval = "5m";
  for (let i = 0; i < listData.length; i++) {
    try {
      let isStoch = false;
      let isRSI = false;
      let isRSIdown = false;
      let isMFI = false;
      let isDMI_ADX = false;
      let isMACD = false;
      let isEMA = false;
      let isWilliams = false;
      let isMA = false;
      let isRS = false;

      const { symbol } = listData[i];
      console.log(`${i}. symbol: ${symbol}`);
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

      // let todayPrice = await query("SELECT * FROM data where symbol = ?", [
      //   symbol,
      // ]);
      // todayPrice = todayPrice.map((item, index) => {
      //   return {
      //     symbol,
      //     TradingDate: item.date,
      //     Time: item.time,
      //     Open: item.open,
      //     High: item.high,
      //     Low: item.low,
      //     Close: item.close,
      //     Volume: item.volume,
      //   };
      // });
      // if (symbol === "AAS") {
      //   console.log("todayPrice: ", todayPrice);
      // }
      // listSymbol = [...listSymbol, ...todayPrice];
      // listSymbol = groupDataByTime(listSymbol, "2h");

      let bPrices = listSymbol
        ? listSymbol.map((item, index) => {
            return {
              symbol: symbol,
              date: item.TradingDate,
              time: item.Time,
              open: item.Open,
              high: item.High,
              low: item.Low,
              close: item.Close,
              volume: item.Volume,
            };
          })
        : [];
      let mapPrices = bPrices.map((item, index) => {
        return +item.close;
      });
      // console.log("length: ", mapPrices.length);
      if (mapPrices[mapPrices.length - 1] === 0) {
        mapPrices.pop();
      }

      let high = bPrices.map((item, index) => {
        return +item.high;
      });
      let low = bPrices.map((item, index) => {
        return +item.low;
      });
      let close = bPrices.map((item, index) => {
        return +item.close;
      });
      let volume = bPrices.map((item, index) => {
        return +item.volume;
      });
      let sma5 = SMA.calculate({ period: 5, values: mapPrices });
      let sma10 = SMA.calculate({ period: 10, values: mapPrices });
      let sma15 = SMA.calculate({ period: 15, values: mapPrices });
      let sma20 = SMA.calculate({ period: 20, values: mapPrices });
      let sma50 = SMA.calculate({ period: 50, values: mapPrices });
      let sma100 = SMA.calculate({ period: 100, values: mapPrices });
      let sma150 = SMA.calculate({ period: 150, values: mapPrices });
      let sma200 = SMA.calculate({ period: 200, values: mapPrices });

      let curSma5 = sma5[sma5.length - 1];
      let curSma10 = sma10[sma10.length - 1];
      let curSma15 = sma15[sma15.length - 1];
      let curSma20 = sma20[sma20.length - 1];
      let curSma50 = sma50[sma50.length - 1];
      let curSma100 = sma100[sma100.length - 1];
      let curSma150 = sma150[sma150.length - 1];
      let curSma200 = sma200[sma200.length - 1];

      let prevSma5 = sma5[sma5.length - 2];
      let prevSma10 = sma10[sma10.length - 2];
      let prevSma15 = sma15[sma15.length - 2];
      let prevSma20 = sma20[sma20.length - 2];
      let prevSma50 = sma50[sma50.length - 2];
      let prevSma100 = sma100[sma100.length - 2];
      let prevSma150 = sma150[sma150.length - 2];
      let prevSma200 = sma200[sma200.length - 2];

      if (symbol === "AAA") {
        console.log("mapPrices: ", mapPrices.length);
        fs.writeFileSync("./mapPriceAAA.json", JSON.stringify(mapPrices));
        console.log("curSma5: ", curSma5);
        console.log("curSma10: ", curSma10);
        console.log("curSma15: ", curSma15);
        console.log("curSma20: ", curSma20);
        console.log("curSma50: ", curSma50);
      }

      if (symbol === "AAS") {
        console.log("mapPrices: ", mapPrices.length);
        fs.writeFileSync("./mapPriceAAS.json", JSON.stringify(mapPrices));
        console.log("curSma5: ", curSma5);
        console.log("curSma10: ", curSma10);
        console.log("curSma15: ", curSma15);
        console.log("curSma20: ", curSma20);
        console.log("curSma50: ", curSma50);
      }

      let symbolSMA = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolSMA?.length > 0) {
        await query(
          "UPDATE index_value SET sma5 = ?,sma10 = ?,sma15 = ?,sma20 = ?,sma50 = ?,sma100 = ?,sma150 = ?,sma200 = ?,sma5_yesterday = ?,sma10_yesterday = ?,sma15_yesterday = ?,sma20_yesterday = ?,sma50_yesterday = ?,sma100_yesterday = ?,sma150_yesterday = ?,sma200_yesterday = ?,date=?,time=?  WHERE symbol = ?",
          [
            curSma5 ? curSma5.toString() : "",
            curSma10 ? curSma10.toString() : "",
            curSma15 ? curSma15.toString() : "",
            curSma20 ? curSma20.toString() : "",
            curSma50 ? curSma50.toString() : "",
            curSma100 ? curSma100.toString() : "",
            curSma150 ? curSma150.toString() : "",
            curSma200 ? curSma200.toString() : "",
            prevSma5 ? prevSma5.toString() : "",
            prevSma10 ? prevSma10.toString() : "",
            prevSma15 ? prevSma15.toString() : "",
            prevSma20 ? prevSma20.toString() : "",
            prevSma50 ? prevSma50.toString() : "",
            prevSma100 ? prevSma100.toString() : "",
            prevSma150 ? prevSma150.toString() : "",
            prevSma200 ? prevSma200.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      let lineSMA = `${moment().format(
        "HH:mm:ss"
      )}-${interval}-${symbol}-sma10:${JSON.stringify(
        curSma10
      )}- sma20:${JSON.stringify(curSma20)}- sma50:${JSON.stringify(
        curSma50
      )}- sma150:${JSON.stringify(curSma150)}- sma200:${JSON.stringify(
        curSma200
      )}\n`;
      fs.appendFileSync("SMA.txt", lineSMA);
      if (
        curSma10 > curSma20 &&
        curSma20 > curSma50 &&
        curSma50 > curSma150 &&
        curSma150 > curSma200
      ) {
        isMA = true;
      }

      //MFI
      let mfi = MFI.calculate({
        high: high,
        low: low,
        close: close,
        volume: volume,
        period: 20,
      });
      if (symbol === "ACB") {
        console.log("high: ", high[high.length - 1]);
        console.log("low: ", low[low.length - 1]);
        console.log("close: ", close[close.length - 1]);
        console.log("volume: ", volume[volume.length - 1]);

        console.log("hight yesterday: ", high[high.length - 2]);
        console.log("low yesterday: ", low[low.length - 2]);
        console.log("close yesterday: ", close[close.length - 2]);
        console.log("volume yesterday: ", volume[volume.length - 2]);
      }
      let curMFI = mfi[mfi.length - 1];
      let prevMFI = mfi[mfi.length - 2];

      let symbolMFI = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolMFI?.length > 0) {
        await query(
          "UPDATE index_value SET mfi = ?,mfi_yesterday = ?,date=?,time=?  WHERE symbol = ?",
          [
            curMFI ? curMFI.toString() : "",
            prevMFI ? prevMFI.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //EMA
      let ema5 = EMA.calculate({ period: 5, values: mapPrices });
      let ema10 = EMA.calculate({ period: 10, values: mapPrices });
      let ema15 = EMA.calculate({ period: 15, values: mapPrices });
      let ema20 = EMA.calculate({ period: 20, values: mapPrices });
      let ema50 = EMA.calculate({ period: 50, values: mapPrices });
      let ema100 = EMA.calculate({ period: 100, values: mapPrices });
      let ema200 = EMA.calculate({ period: 200, values: mapPrices });

      let curEma5 = ema5[ema5.length - 1];
      let curEma10 = ema10[ema10.length - 1];
      let curEma15 = ema15[ema15.length - 1];
      let curEma20 = ema20[ema20.length - 1];
      let curEma50 = ema50[ema50.length - 1];
      let curEma100 = ema100[ema100.length - 1];
      let curEma200 = ema200[ema200.length - 1];

      let prevEma5 = ema5[ema5.length - 2];
      let prevEma10 = ema10[ema10.length - 2];
      let prevEma15 = ema15[ema15.length - 2];
      let prevEma20 = ema20[ema20.length - 2];
      let prevEma50 = ema50[ema50.length - 2];
      let prevEma100 = ema100[ema100.length - 2];
      let prevEma200 = ema200[ema200.length - 2];

      let symbolEMA = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolEMA?.length > 0) {
        await query(
          "UPDATE index_value SET ema5 = ?,ema10 = ?,ema15 = ?,ema20 = ?,ema50 = ?,ema100 = ?,ema200 = ?,ema5_yesterday = ?,ema10_yesterday = ?,ema15_yesterday = ?,ema20_yesterday = ?,ema50_yesterday = ?,ema100_yesterday = ?,ema200_yesterday = ?,date=?,time=?  WHERE symbol = ?",
          [
            curEma5 ? curEma5.toString() : "",
            curEma10 ? curEma10.toString() : "",
            curEma15 ? curEma15.toString() : "",
            curEma20 ? curEma20.toString() : "",
            curEma50 ? curEma50.toString() : "",
            curEma100 ? curEma100.toString() : "",
            curEma200 ? curEma200.toString() : "",
            prevEma5 ? prevEma5.toString() : "",
            prevEma10 ? prevEma10.toString() : "",
            prevEma15 ? prevEma15.toString() : "",
            prevEma20 ? prevEma20.toString() : "",
            prevEma50 ? prevEma50.toString() : "",
            prevEma100 ? prevEma100.toString() : "",
            prevEma200 ? prevEma200.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //CLOSE
      let curClose = mapPrices[mapPrices.length - 1];
      let prevClose = mapPrices[mapPrices.length - 2];
      let close1 = mapPrices[mapPrices.length - 1];
      let close2 = mapPrices[mapPrices.length - 2];
      let close3 = mapPrices[mapPrices.length - 3];
      let close4 = mapPrices[mapPrices.length - 4];
      let close5 = mapPrices[mapPrices.length - 5];
      let close6 = mapPrices[mapPrices.length - 6];
      let close7 = mapPrices[mapPrices.length - 7];
      let close8 = mapPrices[mapPrices.length - 8];
      let close9 = mapPrices[mapPrices.length - 9];
      let close10 = mapPrices[mapPrices.length - 10];
      let close11 = mapPrices[mapPrices.length - 11];

      let symbolClose = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolClose?.length > 0) {
        await query(
          "UPDATE index_value SET close = ?,close_yesterday = ?,close1 = ?,close2 = ?,close3 = ?,close4 = ?,close5 = ?,close6 = ?,close7 = ?,close8 = ?,close9 = ?,close10 = ?,close11 = ?,date=?,time=?  WHERE symbol = ?",
          [
            curClose ? curClose.toString() : "",
            prevClose ? prevClose.toString() : "",
            close1 ? close1.toString() : "",
            close2 ? close2.toString() : "",
            close3 ? close3.toString() : "",
            close4 ? close4.toString() : "",
            close5 ? close5.toString() : "",
            close6 ? close6.toString() : "",
            close7 ? close7.toString() : "",
            close8 ? close8.toString() : "",
            close9 ? close9.toString() : "",
            close10 ? close10.toString() : "",
            close11 ? close11.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //RSI
      let rsi = RSI.calculate({ period: 14, values: mapPrices });
      let curRSI = rsi[rsi.length - 1];
      let prevRSI = rsi[rsi.length - 2];
      let symbolRSI = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolRSI?.length > 0) {
        await query(
          "UPDATE index_value SET rsi14 = ?,rsi14_yesterday = ?,date=?,time=?  WHERE symbol = ?",
          [
            curRSI ? curRSI.toString() : "",
            prevRSI ? prevRSI.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      } else {
        await query(
          "INSERT INTO index_value (symbol, rsi14, rsi14_yesterday, date, time) VALUES (?,?,?,?,?)",
          [
            symbol,
            curRSI ? curRSI.toString() : "",
            prevRSI ? prevRSI.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
          ]
        );
      }
      // fs.writeFileSync("mapPrice.txt", mapPrices.reverse().join("\n"));
      // console.log("rsi: ", rsi.reverse());
      let lineRSI = `${moment().format(
        "HH:mm:ss"
      )}-${interval}-${symbol}-${JSON.stringify(curRSI)}\n`;
      fs.appendFileSync("RSI.txt", lineRSI);
      if ((curRSI > listConfig.RSIValue && listConfig.RSI) || !listConfig.RSI) {
        isRSI = true;
      }

      //MACD
      let macd = MACD.calculate({
        values: mapPrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      let curMACD = macd[macd.length - 1]?.MACD || "";
      let prevMACD = macd[macd.length - 2]?.MACD || "";
      let curSignal = macd[macd.length - 1]?.signal || "";
      let prevSignal = macd[macd.length - 2]?.signal || "";
      let histogram1 = macd[macd.length - 1]?.histogram || "";
      let histogram2 = macd[macd.length - 2]?.histogram || "";
      let histogram3 = macd[macd.length - 3]?.histogram || "";
      let histogram4 = macd[macd.length - 4]?.histogram || "";
      let histogram5 = macd[macd.length - 5]?.histogram || "";
      let histogram6 = macd[macd.length - 6]?.histogram || "";
      let histogram7 = macd[macd.length - 7]?.histogram || "";
      let histogram8 = macd[macd.length - 8]?.histogram || "";
      let histogram9 = macd[macd.length - 9]?.histogram || "";
      let histogram10 = macd[macd.length - 10]?.histogram || "";
      let histogram11 = macd[macd.length - 11]?.histogram || "";
      let histogram12 = macd[macd.length - 12]?.histogram || "";
      let histogram13 = macd[macd.length - 13]?.histogram || "";
      let histogram14 = macd[macd.length - 14]?.histogram || "";
      let histogram15 = macd[macd.length - 15]?.histogram || "";
      let histogram16 = macd[macd.length - 16]?.histogram || "";
      let histogram17 = macd[macd.length - 17]?.histogram || "";
      let histogram18 = macd[macd.length - 18]?.histogram || "";
      let histogram19 = macd[macd.length - 19]?.histogram || "";
      let histogram20 = macd[macd.length - 20]?.histogram || "";
      let histogram21 = macd[macd.length - 21]?.histogram || "";
      let histogram22 = macd[macd.length - 22]?.histogram || "";
      let histogram23 = macd[macd.length - 23]?.histogram || "";
      let histogram24 = macd[macd.length - 24]?.histogram || "";
      let histogram25 = macd[macd.length - 25]?.histogram || "";
      let histogram26 = macd[macd.length - 26]?.histogram || "";
      let histogram27 = macd[macd.length - 27]?.histogram || "";
      let histogram28 = macd[macd.length - 28]?.histogram || "";
      let histogram29 = macd[macd.length - 29]?.histogram || "";
      let histogram30 = macd[macd.length - 30]?.histogram || "";
      let histogram31 = macd[macd.length - 31]?.histogram || "";

      let symbolMACD = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolMACD?.length > 0) {
        await query(
          "UPDATE index_value SET macd = ?,macd_yesterday = ?,signal_today = ?,signal_yesterday = ?,date=?,time=?,histogram1=?,histogram2=?,histogram3=?,histogram4=?,histogram5=?,histogram6=?,histogram7=?,histogram8=?,histogram9=?,histogram10=?,histogram11=?,histogram12=?,histogram13=?,histogram14=?,histogram15=?,histogram16=?,histogram17=?,histogram18=?,histogram19=?,histogram20=?,histogram21=?,histogram22=?,histogram23=?,histogram24=?,histogram25=?,histogram26=?,histogram27=?,histogram28=?,histogram29=?,histogram30=?,histogram31=?  WHERE symbol = ?",
          [
            curMACD ? curMACD.toString() : "",
            prevMACD ? prevMACD.toString() : "",
            curSignal ? curSignal.toString() : "",
            prevSignal ? prevSignal.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            histogram1 ? histogram1.toString() : "",
            histogram2 ? histogram2.toString() : "",
            histogram3 ? histogram3.toString() : "",
            histogram4 ? histogram4.toString() : "",
            histogram5 ? histogram5.toString() : "",
            histogram6 ? histogram6.toString() : "",
            histogram7 ? histogram7.toString() : "",
            histogram8 ? histogram8.toString() : "",
            histogram9 ? histogram9.toString() : "",
            histogram10 ? histogram10.toString() : "",
            histogram11 ? histogram11.toString() : "",
            histogram12 ? histogram12.toString() : "",
            histogram13 ? histogram13.toString() : "",
            histogram14 ? histogram14.toString() : "",
            histogram15 ? histogram15.toString() : "",
            histogram16 ? histogram16.toString() : "",
            histogram17 ? histogram17.toString() : "",
            histogram18 ? histogram18.toString() : "",
            histogram19 ? histogram19.toString() : "",
            histogram20 ? histogram20.toString() : "",
            histogram21 ? histogram21.toString() : "",
            histogram22 ? histogram22.toString() : "",
            histogram23 ? histogram23.toString() : "",
            histogram24 ? histogram24.toString() : "",
            histogram25 ? histogram25.toString() : "",
            histogram26 ? histogram26.toString() : "",
            histogram27 ? histogram27.toString() : "",
            histogram28 ? histogram28.toString() : "",
            histogram29 ? histogram29.toString() : "",
            histogram30 ? histogram30.toString() : "",
            histogram31 ? histogram31.toString() : "",
            symbol,
          ]
        );
      }

      let lineMACD = `${moment().format(
        "HH:mm:ss"
      )}-1m-${symbol}-curMACD:${JSON.stringify(
        curMACD
      )}-prevMACD:${JSON.stringify(prevMACD)}\n`;
      fs.appendFileSync("MACD.txt", lineMACD);

      //STOCH
      let stoch = Stochastic.calculate({
        high: high,
        low: low,
        close: close,
        signalPeriod: 5,
        period: 13,
      });
      let curStochK = stoch[stoch.length - 1]?.k || "";
      let curStochD = stoch[stoch.length - 1]?.d || "";
      let curStochKYesterday = stoch[stoch.length - 2]?.k || "";
      let curStochDYesterday = stoch[stoch.length - 2]?.d || "";
      let symbolStoch = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolStoch?.length > 0) {
        await query(
          "UPDATE index_value SET stochK = ?,stochD = ?,stochK_yesterday = ?,stochD_yesterday = ?,date=?,time=? WHERE symbol = ?",
          [
            curStochK ? curStochK.toString() : "",
            curStochD ? curStochD.toString() : "",
            curStochKYesterday ? curStochKYesterday.toString() : "",
            curStochDYesterday ? curStochDYesterday.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //ADX
      let adx = ADX.calculate({
        high: high,
        low: low,
        close: close,
        period: 14,
      });
      let curAdx = adx[adx.length - 1]?.adx || "";
      let prevAdx = adx[adx.length - 2]?.adx || "";
      let curPdi = adx[adx.length - 1]?.pdi || "";
      let curMdi = adx[adx.length - 1]?.mdi || "";
      let prevPdi = adx[adx.length - 2]?.pdi || "";
      let prevMdi = adx[adx.length - 2]?.mdi || "";
      let symbolAdx = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolAdx?.length > 0) {
        await query(
          "UPDATE index_value SET adx = ?,adx_yesterday = ?,pdi = ?,mdi = ?,pdi_yesterday = ?,mdi_yesterday = ?,date=?,time=? WHERE symbol = ?",
          [
            curAdx ? curAdx.toString() : "",
            prevAdx ? prevAdx.toString() : "",
            curPdi ? curPdi.toString() : "",
            curMdi ? curMdi.toString() : "",
            prevPdi ? prevPdi.toString() : "",
            prevMdi ? prevMdi.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //PSAR
      let psar = PSAR.calculate({
        high: high,
        low: low,
        step: 0.02,
        max: 0.2,
      });
      let curPsar = psar[psar.length - 1] || "";
      let prevPsar = psar[psar.length - 2] || "";

      let symbolPsar = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolPsar?.length > 0) {
        await query(
          "UPDATE index_value SET psar = ?,psar_yesterday = ?,date=?,time=? WHERE symbol = ?",
          [
            curPsar ? curPsar.toString() : "",
            prevPsar ? prevPsar.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //ICHIMOKU
      let ichimokuInput = {
        high: high,
        low: low,
        conversionPeriod: 9,
        basePeriod: 26,
        spanPeriod: 52,
        displacement: 26,
      };
      let ichimoku = ICHIMOKU.calculate(ichimokuInput);
      let curTenkan = ichimoku[ichimoku.length - 1]?.conversion || "";
      let curKijun = ichimoku[ichimoku.length - 1]?.base || "";
      let curCloud = ichimoku[ichimoku.length - 1]?.spanB || "";
      let prevTenkan = ichimoku[ichimoku.length - 2]?.conversion || "";
      let prevKijun = ichimoku[ichimoku.length - 2]?.base || "";
      let prevCloud = ichimoku[ichimoku.length - 2]?.spanB || "";

      let symbolIchimoku = await query(
        "SELECT * from index_value WHERE symbol = ?",
        [symbol]
      );
      if (symbolIchimoku?.length > 0) {
        await query(
          "UPDATE index_value SET tenkan = ?,kijun = ?,cloud = ?,tenkan_yesterday = ?,kijun_yesterday = ?,cloud_yesterday = ?,date=?,time=? WHERE symbol = ?",
          [
            curTenkan ? curTenkan.toString() : "",
            curKijun ? curKijun.toString() : "",
            curCloud ? curCloud.toString() : "",
            prevTenkan ? prevTenkan.toString() : "",
            prevKijun ? prevKijun.toString() : "",
            prevCloud ? prevCloud.toString() : "",
            moment().format("DD/MM/YYYY"),
            moment().format("HH:mm:ss"),
            symbol,
          ]
        );
      }

      //BB
      let bb = BB.calculate({
        period: 20,
        values: mapPrices,
        stdDev: 2,
      });

      let upperBB1 = bb[bb.length - 1]?.upper || "";
      let upperBB2 = bb[bb.length - 2]?.upper || "";
      let upperBB3 = bb[bb.length - 3]?.upper || "";
      let upperBB4 = bb[bb.length - 4]?.upper || "";
      let upperBB5 = bb[bb.length - 5]?.upper || "";
      let upperBB6 = bb[bb.length - 6]?.upper || "";
      let upperBB7 = bb[bb.length - 7]?.upper || "";
      let upperBB8 = bb[bb.length - 8]?.upper || "";
      let upperBB9 = bb[bb.length - 9]?.upper || "";
      let upperBB10 = bb[bb.length - 10]?.upper || "";
      let upperBB11 = bb[bb.length - 11]?.upper || "";

      let lowerBB1 = bb[bb.length - 1]?.lower || "";
      let lowerBB2 = bb[bb.length - 2]?.lower || "";
      let lowerBB3 = bb[bb.length - 3]?.lower || "";
      let lowerBB4 = bb[bb.length - 4]?.lower || "";
      let lowerBB5 = bb[bb.length - 5]?.lower || "";
      let lowerBB6 = bb[bb.length - 6]?.lower || "";
      let lowerBB7 = bb[bb.length - 7]?.lower || "";
      let lowerBB8 = bb[bb.length - 8]?.lower || "";
      let lowerBB9 = bb[bb.length - 9]?.lower || "";
      let lowerBB10 = bb[bb.length - 10]?.lower || "";
      let lowerBB11 = bb[bb.length - 11]?.lower || "";

      let symbolBB = await query("SELECT * from index_value WHERE symbol = ?", [
        symbol,
      ]);
      if (symbolBB?.length > 0) {
        await query(
          "UPDATE index_value SET upperBB1 = ?,upperBB2 = ?,upperBB3 = ?,upperBB4 = ?,upperBB5 = ?,upperBB6 = ?,upperBB7 = ?,upperBB8 = ?,upperBB9 = ?,upperBB10 = ?,upperBB11 = ?,lowerBB1 = ?,lowerBB2 = ?,lowerBB3 = ?,lowerBB4 = ?,lowerBB5 = ?,lowerBB6 = ?,lowerBB7 = ?,lowerBB8 = ?,lowerBB9 = ?,lowerBB10 = ?,lowerBB11 = ? WHERE symbol = ?",
          [
            upperBB1 ? upperBB1.toString() : "",
            upperBB2 ? upperBB2.toString() : "",
            upperBB3 ? upperBB3.toString() : "",
            upperBB4 ? upperBB4.toString() : "",
            upperBB5 ? upperBB5.toString() : "",
            upperBB6 ? upperBB6.toString() : "",
            upperBB7 ? upperBB7.toString() : "",
            upperBB8 ? upperBB8.toString() : "",
            upperBB9 ? upperBB9.toString() : "",
            upperBB10 ? upperBB10.toString() : "",
            upperBB11 ? upperBB11.toString() : "",
            lowerBB1 ? lowerBB1.toString() : "",
            lowerBB2 ? lowerBB2.toString() : "",
            lowerBB3 ? lowerBB3.toString() : "",
            lowerBB4 ? lowerBB4.toString() : "",
            lowerBB5 ? lowerBB5.toString() : "",
            lowerBB6 ? lowerBB6.toString() : "",
            lowerBB7 ? lowerBB7.toString() : "",
            lowerBB8 ? lowerBB8.toString() : "",
            lowerBB9 ? lowerBB9.toString() : "",
            lowerBB10 ? lowerBB10.toString() : "",
            lowerBB11 ? lowerBB11.toString() : "",
            symbol,
          ]
        );
      }

      // //EMA
      // let ema = EMA.calculate({
      //   period: listConfig.EMAValue,
      //   values: mapPrices,
      // });
      // let curEma = ema[ema.length - 1];
      // let lineEMA = `${moment().format("HH:mm:ss")}-1D-${symbol}-${JSON.stringify(
      //   curEma
      // )}\n`;
      // fs.appendFileSync("EMA.txt", lineEMA);

      //Checking
      if (isMA) {
        listMatchMA.push({
          symbol: symbol,
          time: "1d",
        });
      }
      if (isRSI) {
        listMatchRSI.push({
          symbol: symbol,
          time: "1d",
        });
      }
      if (isMACD) {
        listMatchMACD.push({
          symbol: symbol,
          time: "1d",
        });
      }
      //delay 500ms
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      continue;
    }
  }
}
