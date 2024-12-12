const axios = require("axios");
const query = require("./common/query");
const fs = require("fs");
const moment = require("moment");

const MAX_RETRIES = 3; // maximum number of retries
const RETRY_DELAY = 5000; // retry delay in milliseconds

const axiosWithRetry = async (url, retries) => {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error) {
    if (retries <= 0) {
      throw new Error(`Max retries reached for url: ${url}`);
    }
    console.log(`Retrying ${url}. Attempts remaining: ${retries - 1}`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    return await axiosWithRetry(url, retries - 1);
  }
};

const getPrice = async (symbol) => {
  let offset = 0;
  let listSymbol = [];
  try {
    for (let i = 0; i < 24; i++) {
      console.log(`symbol: ${symbol} - offset: ${offset}`);
      let fromDate = moment()
        .subtract(offset + 30, "days")
        .format("DD/MM/YYYY");
      let toDate = moment().subtract(offset, "days").format("DD/MM/YYYY");
      let url = `http://localhost:3020/IntradayOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`;
      let response = await axiosWithRetry(url, MAX_RETRIES);
      listSymbol = response.data.data
        ? [...listSymbol, ...response.data.data.reverse()]
        : listSymbol;
      offset += 31;
    }

    let bPrices = listSymbol
      ? listSymbol.map((item, index) => {
          return {
            symbol: symbol,
            date: moment(item.TradingDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
            time: item.Time,
            open: item.Open,
            high: item.High,
            low: item.Low,
            close: item.Close,
            volume: item.Volume,
            timestamp: moment(
              `${item.Time}-${item.TradingDate}`,
              "hh:mm:ss-DD/MM/YYYY"
            ).format("X"),
          };
        })
      : [];
    console.log("bPrices before remove zero: ", bPrices.length);

    bPrices = bPrices.filter(
      (item) =>
        item.open !== "0" &&
        item.close !== "0" &&
        item.high !== "0" &&
        item.low !== "0" &&
        item.volume !== "0"
    );
    console.log("bPrices after remove zero: ", bPrices.length);
    fs.writeFileSync(`./data1m/${symbol}.json`, JSON.stringify(bPrices));
    let bPricesMap = bPrices.map((item) => {
      return [
        item.symbol,
        item.date,
        item.open,
        item.high,
        item.low,
        item.close,
        +item.volume,
        +item.timestamp,
        item.time,
      ];
    });
    if (bPricesMap.length > 0) {
      //delete all symbol === symbol in history_1m
      await query("DELETE FROM history_1m WHERE symbol = ?", [symbol]);
      //insert new symbol
      await query(
        "INSERT INTO history_1m (symbol, date, open, high, low, close, volume, timestamp, time) VALUES ?",
        [bPricesMap]
      );
    }
  } catch (error) {
    console.log(`Error for symbol ${symbol}:`, error);
  }
};

const mainLoop = async () => {
  try {
    console.time("Total Execution Time");
    let listData = await query("SELECT symbol from data");
    console.log("listData.length:", listData.length);
    listData.reverse();

    const chunkSize = Math.ceil(listData.length / 10);
    const listDataChunks = Array.from({ length: 10 }, (_, i) =>
      listData.slice(i * chunkSize, i * chunkSize + chunkSize)
    );

    await Promise.all(
      listDataChunks.map(async (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          const { symbol } = chunk[i];
          await getPrice(symbol);
        }
      })
    );
    console.timeEnd("Total Execution Time");
  } catch (error) {
    console.log("Main loop error: ", error);
  }
  mainLoop(); // Call itself after finishing
};

// Run the main loop once immediately upon startup
mainLoop();
