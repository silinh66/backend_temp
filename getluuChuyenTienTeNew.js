const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
const moment = require("moment");
const puppeteer = require("puppeteer");

const getFinancialRatioNew = async (symbol) => {
  // Optional: if you only fetch 2024 Q3-Q4 data, keep your generateYearArray logic if needed
  function generateYearArray() {
    const years = [];
    let curYear = 2024;
    for (let year = 2024; year <= curYear; year++) {
      for (let i = 3; i <= 4; i++) {
        years.push("Timeline=" + year + "_" + i);
      }
    }
    return years;
  }

  // This timeline is what you filter on in the request
  const curTimeline = "2024_4";

  // Launch browser
  const profilePath =
    "C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1";
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    userDataDir: profilePath,
  });
  const page = await browser.newPage();

  // Go to fiintrade.vn
  await page.goto("https://fiintrade.vn", { waitUntil: "networkidle0" });

  // If you need to log in, do it here (uncomment if needed):
  // await page.waitForSelector(".login-button");
  // await page.click(".login-button");
  // await page.waitForSelector("#exampleInputEmail1");
  // await page.type("#exampleInputEmail1", "your-email");
  // await page.type("#exampleInputPassword1", "your-password");
  // await page.click("#home > form > fieldset > div:nth-child(3) > button");
  // await page.waitForNavigation({ waitUntil: "networkidle0" });

  // Interact with the search/ticker
  await page.waitForSelector(".company-name");
  await page.evaluate(() => document.querySelector(".company-name").click());
  // await page.evaluate(() => document.querySelector(".company-name").click());
  await page.type(".ticker", symbol);
  await page.keyboard.press("Enter");

  // 1) Wait for the specific GET request to appear
  // 2) Check that it's the JSON with the correct timeline & symbol
  try {
    // Attempt to wait for the specific request up to 30s
    response = await page.waitForResponse(
      (res) => {
        const url = res.url();
        return (
          url.includes(
            "fundamental.fiintrade.vn/FinancialStatement/GetCashFlow"
          ) && res.request().method() === "GET"
        );
      },
      { timeout: 5000 } // 30s
    );
  } catch (error) {
    // If we have a TimeoutError, just skip this symbol and move on
    if (error.name === "TimeoutError") {
      console.log(
        `Timed out waiting for fiintrade data request: symbol=${symbol}, timeline=${curTimeline}`
      );
      await browser.close();
      return;
    } else {
      // If it's some other error, re-throw or handle differently
      throw error;
    }
  }

  if (!response) {
    console.log("No response for the ratio data (timed out or not found).");
    await browser.close();
    return;
  }

  // Parse the JSON
  const data = await response.json();
  if (!data?.items?.length) {
    console.log("Data is empty or invalid.");
    await browser.close();
    return;
  }

  // Filter/transform data as needed
  let dataResponse = data?.items;
  let dataNam = dataResponse?.map((item) => item?.yearly);
  if (!dataNam) return;
  let dataNamFilter = dataNam[0]?.filter(
    (item) => item?.yearReport === 2024 && item?.quarterReport === 5
  );

  if (!dataNamFilter.length) {
    console.log(`No matching items for symbol ${symbol}`);
    await browser.close();
    return;
  }
  let dataNamMap = dataNamFilter?.map((item) => {
    return [symbol, ...Object.values(item).slice(1)];
  });

  console.log(`dataNamMap ${symbol}: `, dataNamMap?.length);
  // console.log("dataFinancialMap: ", dataFinancialMap);

  // Example: insert into DB, etc...
  // await query(`DELETE FROM financial_ratio WHERE organCode='${symbol}'`);
  await query("INSERT INTO luu_chuyen_tien_te VALUES ?", [dataNamMap]);

  console.log("Inserted SUCCESS data year for symbol", symbol);

  let dataQuy = dataResponse?.map((item) => item?.quarterly);
  if (!dataQuy) return;
  let dataQuyFilter = dataQuy[0]?.filter(
    (item) => item?.yearReport === 2024 && item?.quarterReport === 4
  );
  let dataQuyMap = dataQuyFilter?.map((item) => {
    return [symbol, ...Object.values(item).slice(1)];
  });
  console.log(`dataQuyMap ${symbol}: `, dataQuyMap?.length);
  // console.log("dataFinancialMap: ", dataFinancialMap);

  // Example: insert into DB, etc...
  // await query(`DELETE FROM financial_ratio WHERE organCode='${symbol}'`);
  await query("INSERT INTO luu_chuyen_tien_te VALUES ?", [dataQuyMap]);

  console.log("Inserted SUCCESS data quarter for symbol", symbol);

  // Finally, close the browser
  await browser.close();
};

(async () => {
  let listSymbolData = [];

  let response = await axios.get(
    `http://127.0.0.1:3020/Securities?pageIndex=1&pageSize=1000`
  );
  listSymbolData = response?.data?.data || listSymbolData;
  //wait 1s
  await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
  response = await axios.get(
    `http://127.0.0.1:3020/Securities?pageIndex=2&pageSize=1000`
  );
  listSymbolData = response.data.data
    ? [...listSymbolData, ...response.data.data]
    : listSymbolData;
  console.log(listSymbolData.length);
  //continue listSymbolData from symbol A32
  let previousSymbol = "CHPG2505";
  let symbolIndex = listSymbolData.findIndex(
    (item) => item.Symbol === previousSymbol
  );
  listSymbolDataContinue = listSymbolData.slice(symbolIndex);
  for (let i = 0; i < listSymbolDataContinue.length; i++) {
    const symbol = listSymbolDataContinue[i]?.Symbol;
    console.log(symbol);
    // await getFinancialRatio(symbol);
    await getFinancialRatioNew(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
  }
})();

// getFinancialRatioNew("A32");
