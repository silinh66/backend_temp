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
   //wait 1s
   await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
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
    await getNews(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getNews = async (symbol) => {
  let toDate = moment().format("DD%2FMM%2FYYYY");
  let fromDate = moment().subtract(5, "months").format("DD%2FMM%2FYYYY");
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/news?symbol=${symbol}&pageSize=100&page=1&fromDate=${fromDate}&toDate=${toDate}&language=vn`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI2YTM1MTgwMC1iNjI2LTQ4N2EtYTQxYy1iNTJmOGQzYjRiOTkiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzE4NzY4MzI1LCJleHAiOjE3MTg3OTcxMjV9.WMlCmbjdTnVwOVu_KaiFuRZUgyKooSYLGotr9Yy0MKg",
          // "device-id": "C982B4D5-5509-4252-916C-048FDF085619",
          // "if-none-match": 'W/"1286-kBDGH0Q9WUENN9STF/SglEeaNgQ"',
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiZTQwYTYwZjc4NjZjZjM0OCIsInRyIjoiOGY2Y2FjZjQyNDIxMmIxNGM3NDFjMDdjMzU1ZDE5MDAiLCJ0aSI6MTcxODc2ODQ0NTk5N319",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          // "sec-fetch-site": "same-site",
          traceparent:
            "00-8f6cacf424212b14c741c07c355d1900-e40a60f7866cf348-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-e40a60f7866cf348----1718768445997",
          Referer: "https://iboard.ssi.com.vn/",
          // "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

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

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          console.log(`dataNewsMap ${symbol}: `, dataNewsMap?.length);

          //delete all news of symbol
          await query("DELETE FROM news WHERE symbol = ?", [symbol]);

          await query("INSERT INTO news VALUES ?", [dataNewsMap]);

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

// getNews("SSI");
