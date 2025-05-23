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
  await page.evaluate(() => document.querySelector(".company-name").click());
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
            "fundamental.fiintrade.vn/FinancialAnalysis/GetFinancialRatioV2"
          ) &&
          url.includes(curTimeline) &&
          res.request().method() === "GET"
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
  const dataNews = data.items;
  const dataFilter = dataNews.filter((item) => item?.key === curTimeline);
  const dataNewsMap = dataFilter.map((item) => item?.value);
  const dataNewsFilter = dataNewsMap.filter(
    (item) => item?.organCode === symbol
  );

  if (!dataNewsFilter.length) {
    console.log(`No matching items for symbol ${symbol}`);
    await browser.close();
    return;
  }

  // Transform to your desired array
  const dataFinancialMap = dataNewsFilter.map((item) => [
    item?.organCode,
    item?.icbCode,
    item?.comTypeCode,
    item?.yearReport,
    item?.lengthReport,
    item?.yearReportCal,
    item?.lengthReportCal,
    item?.rev,
    item?.ryq34,
    item?.isa22,
    item?.ryq39,
    item?.ryq27,
    item?.ryq29,
    item?.ryq25,
    item?.ryq12,
    item?.ryq76,
    item?.ryq14,
    item?.ryq3,
    item?.ryq1,
    item?.ryq2,
    item?.ryq77,
    item?.ryq71,
    item?.ryq31,
    item?.ryq91,
    item?.ryq16,
    item?.ryq18,
    item?.ryq20,
    item?.cashCycle,
    item?.ryq10,
    item?.ryq6,
    item?.ryd11,
    item?.ryd3,
    item?.ryd21,
    item?.ryd25,
    item?.ryd26,
    item?.ryd28,
    item?.ryd14,
    item?.ryd7,
    item?.ryd30,
    item?.bsa1,
    item?.bsa2,
    item?.bsa5,
    item?.bsa8,
    item?.bsa10,
    item?.bsa159,
    item?.bsa15,
    item?.bsa18,
    item?.bsa23,
    item?.bsa24,
    item?.bsa162,
    item?.bsa27,
    item?.bsa29,
    item?.bsa43,
    item?.bsa49,
    item?.bsa50,
    item?.bsa209,
    item?.bsa53,
    item?.bsa54,
    item?.bsa55,
    item?.bsa56,
    item?.bsa58,
    item?.bsa67,
    item?.bsa71,
    item?.bsa173,
    item?.bsa78,
    item?.bsa79,
    item?.bsa80,
    item?.bsa175,
    item?.bsa86,
    item?.bsa90,
    item?.bsa96,
    item?.cfa21,
    item?.cfa22,
  ]);

  console.log(`dataNewsMap ${symbol}: `, dataNewsFilter?.length);
  // console.log("dataFinancialMap: ", dataFinancialMap);

  // Example: insert into DB, etc...
  // await query(`DELETE FROM financial_ratio WHERE organCode='${symbol}'`);
  await query(
    `INSERT INTO financial_ratio (
                organCode,
                icbCode,
                comTypeCode,
                yearReport,
                lengthReport,
                yearReportCal,
                lengthReportCal,
                rev,
                ryq34,
                isa22,
                ryq39,
                ryq27,
                ryq29,
                ryq25,
                ryq12,
                ryq76,
                ryq14,
                ryq3,
                ryq1,
                ryq2,
                ryq77,
                ryq71,
                ryq31,
                ryq91,
                ryq16,
                ryq18,
                ryq20,
                cashCycle,
                ryq10,
                ryq6,
                ryd11,
                ryd3,
                ryd21,
                ryd25,
                ryd26,
                ryd28,
                ryd14,
                ryd7,
                ryd30,
                bsa1,
                bsa2,
                bsa5,
                bsa8,
                bsa10,
                bsa159,
                bsa15,
                bsa18,
                bsa23,
                bsa24,
                bsa162,
                bsa27,
                bsa29,
                bsa43,
                bsa49,
                bsa50,
                bsa209,
                bsa53,
                bsa54,
                bsa55,
                bsa56,
                bsa58,
                bsa67,
                bsa71,
                bsa173,
                bsa78,
                bsa79,
                bsa80,
                bsa175,
                bsa86,
                bsa90,
                bsa96,
                cfa21,
                cfa22
            ) VALUES ?`,
    [dataFinancialMap]
  );

  console.log("Inserted SUCCESS for symbol", symbol);
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
  //continue listSymbolData from symbol BAB122032
  let previousSymbol = "BAB122032";
  let symbolIndex = listSymbolData.findIndex(
    (item) => item.Symbol === previousSymbol
  );
  listSymbolDataContinue = listSymbolData.slice(symbolIndex + 1);
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
