const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");

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
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/leaderships?symbol=${symbol}&language=vn&page=1&pageSize=100`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiJkMDRhNGI3MC1iOTg5LTQxYjMtOTJlNS1hZDcwMmMwODI1NzMiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzAzNDkyOTkyLCJleHAiOjE3MDM1MjE3OTJ9.hkCXNJRr-w55-IW4lg2jgv8QKIxSglmscEtlmbLZtu0",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiODgwNjk0MjEyNGVkMzhhYSIsInRyIjoiZDJiNzlhODU4NTExN2U2ZmVhZDI1NTg3OTA2MGZjMDAiLCJ0aSI6MTcwMzQ5NDIxMjgxNn19",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-d2b79a8585117e6fead255879060fc00-8806942124ed38aa-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-8806942124ed38aa----1703494212816",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    console.log(response);

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
          console.log("jsonObject: ", jsonObject);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;
          let listChildCompany = jsonObject?.data;
          console.log("listChildCompany: ", listChildCompany);
          //   // let dataNews = jsonObject?.data;
          if (!listChildCompany) return;
          if (listChildCompany?.length === 0) return;
          // console.log("dataNews: ", dataNews);
          let dataNewsMap = listChildCompany.map((item) => {
            return [null, ...Object.values(item)];
          });
          await query("INSERT INTO leadership VALUES ?", [dataNewsMap]);

          // return data;
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

// getNews("VIC");
