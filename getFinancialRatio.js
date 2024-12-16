const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
const moment = require("moment");

(async () => {
  let listSymbolData = [];

  let response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  );
  listSymbolData = response?.data?.data || listSymbolData;
  await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  );
  listSymbolData = response.data.data
    ? [...listSymbolData, ...response.data.data]
    : listSymbolData;
  console.log(listSymbolData.length);
  for (let i = 0; i < listSymbolData.length; i++) {
    const symbol = listSymbolData[i]?.Symbol;
    console.log(symbol);
    await getFinancialRatio(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

function generateYearArray() {
  const years = [];
  let curYear = moment().year();
  console.log("curYear: ", curYear);

  for (let year = 2006; year <= curYear; year++) {
    for (let i = 1; i <= 4; i++) {
      years.push("Timeline=" + year + "_" + i);
    }
  }

  return years;
}

function yearArray() {
  const years = [];
  let curYear = moment().year();
  console.log("curYear: ", curYear);

  for (let year = 2006; year <= curYear; year++) {
    years.push("Timeline=" + year + "_" + 5);
  }

  return years;
}
const resultArray = generateYearArray(); //kéo data quý

// const resultArray = yearArray(); //kéo data năm
// console.log("resultArray: ", resultArray);

const getFinancialRatio = async (symbol) => {
  try {
    const response = await fetch(
      `https://fiin-fundamental.ssi.com.vn/FinancialAnalysis/GetFinancialRatioV2?language=vi&Type=Company&OrganCode=${symbol}&${resultArray.join(
        "&"
      )}`,
      {
        headers: {
          accept: "application/json",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-fiin-key": "KEY",
          "x-fiin-seed": "SEED",
          "x-fiin-user-id": "ID",
          "x-fiin-user-token":
            "160,174,107,64,43,205,144,242,127,135,39,154,177,205,49,204,2,104,1,64,150,227,154,98,64,150,215,186,244,198,241,230,130,192,3,252,231,132,132,77,188,82,196,123,204,45,241,37,30,13,191,186,46,79,11,144,148,253,108,252,76,13,225,49,183,233,22,150,22,133,246,5,208,38,95,121,211,60,250,137,32,219,91,103,252,21,101,125,183,222,102,151,183,164,104,146,10,15,151,167,95,30,28,86,158,106,196,126,188,4,81,228,110,54,108,151,211,112,63,231,192,120,69,137,162,201,113,210,73,193,82,74,90,192,166,25,86,169,238,196,227,124,56,149,249,165,154,210,240,163,129,182,255,229,215,160,5,7,219,43,101,237,234,35,35,88,73,138,135,235,197,94,22,214,87,44,209,254,52,17,184,134,49,120,87,123,6,245,193,194,10,202,27,59,34,53,23,62,221,221,8,43,213,125,169,191,114,37,205,206,64,43,150,219,129,17,66,219,176,215,50,30,90,161,14,72,156,190,44,78,133,107,239,23,147,147,207,240,11,179,73,236,243,61,123,238,164,157,34,203,101,217,249,100,19,48",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    // console.log("response: ", response);
    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);
          //   console.log("jsonObject: ", jsonObject);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;

          let dataNews = jsonObject?.items;
          // console.log("dataNews: ", dataNews);
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return item?.value;
          });
          //   console.log("dataNewsMap: ", dataNewsMap);
          let dataFinancialMap = dataNewsMap.map((item) => {
            return [
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
            ];
          });
          console.log(`dataNewsMap ${symbol}: `, dataNewsMap?.length);
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

          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// getFinancialRatio("SSI");
