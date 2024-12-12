// const fetch = require("node-fetch");
// const zlib = require("zlib");
// const { Readable } = require("stream");
// const query = require("./common/query");
// const moment = require("moment");

// const getThongKeGiaoDich = async (symbol) => {
//   try {
//     const response = await fetch(
//       "https://iboard-api.ssi.com.vn/statistics/company/financial-indicator?symbol=AAM&page=1&pageSize=20",
//       {
//         headers: {
//           accept:
//             "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//           "accept-language":
//             "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
//           "cache-control": "max-age=0",
//           "if-none-match": 'W/"1a98-QxrS7C9mPFgsO6cD3PqBxbXtBCY"',
//           "sec-ch-ua":
//             '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
//           "sec-ch-ua-mobile": "?0",
//           "sec-ch-ua-platform": '"Windows"',
//           "sec-fetch-dest": "document",
//           "sec-fetch-mode": "navigate",
//           "sec-fetch-site": "none",
//           "sec-fetch-user": "?1",
//           "upgrade-insecure-requests": "1",
//           cookie:
//             "_ga_KJHZVBRYTH=GS1.1.1693299087.1.1.1693299319.60.0.0; _gcl_au=1.1.1573205341.1701141237; _ga_BR358FQTBG=GS1.1.1701141233.3.1.1701141307.58.0.0; __cuid=2b5f998ea91b4bd892952805b0f4ca02; amp_fef1e8=b53bc194-299f-4a7e-b593-5660d69ed84eR...1hjruogr5.1hjruogr8.31.c.3d; _gid=GA1.3.370662123.1705285541; sso.id_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5zc2kuY29tLnZuIiwic3ViIjoiMjMzNzE4IiwiYXVkIjoiTngwSUpoTXBwaEdpNmRmWSIsImlhdCI6MTcwNTM5OTg2MSwiZXhwIjoxNzM2OTM1ODYxfQ.1nhJzHQbtNV6pEGH-zG6Hi1u2rRPFYWc-bU_BxcZaJU; _ga_EXPYE7627Z=GS1.1.1705399860.86.0.1705399862.0.0.0; _ga_QZJBYSXQCG=GS1.1.1705399863.67.0.1705399863.0.0.0; _ga=GA1.1.1434597638.1692668260; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI1NjQxMmUxNy0zY2EwLTQyZWQtOTUxZS03ODU0ZDk2Zjg4MjQiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzA1Mzk5ODY0LCJleHAiOjE3MDU0Mjg2NjR9.L3x8ejguSWCz04h06ooPN9H10qeQsJToum7bYPBjKfE; _ga_N4QS6QWZH6=GS1.1.1705399858.105.1.1705399865.53.0.0; _cfuvid=tMqnXa0Mhy3IOzI2xu761DgJjwHlPceD_jyNce1S_BY-1705442516210-0-604800000; __cf_bm=FsNog3NIrlXnIanDicnAjEE1HLItLRU2._cCBeR7YJk-1705466537-1-AV+egN26d9JiEY+wzT3Ix/qVfLt0/GOrtzsS0FfOnodKPp7Oba1C8hPeF3ydN8AGqSrhHB6+XTMILcIWWXG/IWY=",
//         },
//         referrerPolicy: "strict-origin-when-cross-origin",
//         body: null,
//         method: "GET",
//       }
//     );
//     console.log(response.body);

//     if (response.body instanceof zlib.Gunzip) {
//       const gunzipStream = response.body;

//       // Tạo một readable stream từ gunzip stream
//       const readableStream = new Readable().wrap(gunzipStream);

//       let data = "";
//       readableStream.on("data", (chunk) => {
//         data += chunk;
//       });

//       readableStream.on("end", async () => {
//         try {
//           // Chuyển đổi dữ liệu đã giải nén thành chuỗi
//           const decompressedString = data.toString();

//           // Chuyển chuỗi JSON thành đối tượng
//           const jsonObject = JSON.parse(decompressedString);

//           // Sử dụng đối tượng jsonObject ở đây
//           //   console.log(jsonObject);
//           if (!jsonObject) return;

//           let dataNews = jsonObject?.data;
//           if (!dataNews) return;
//           if (dataNews?.length === 0) return;
//           console.log("dataNews: ", dataNews);
//           let dataNewsMap = dataNews.map((item) => {
//             return [null, ...Object.values(item)];
//           });
//           // await query("INSERT INTO stock_price VALUES ?", [dataNewsMap]);

//           return data;
//         } catch (error) {
//           console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
//         }
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// };

// getThongKeGiaoDich("AAM");

const cron = require("node-cron");
const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
const moment = require("moment");

const getNewsDaily = async () => {
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
    await getThongKeGiaoDich(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
};

const getThongKeGiaoDich = async (symbol) => {
  let todayString = moment().format("DD%2FMM%2FYYYY");
  console.log("todayString: ", todayString);

  let twoYearsAgoDate = moment().subtract(2, "years").format("DD%2FMM%2FYYYY");
  console.log("twoYearsAgoDate: ", twoYearsAgoDate);
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/stock-price?symbol=${symbol}&page=1&pageSize=300&fromDate=${twoYearsAgoDate}&toDate=${todayString}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI4YzMxYmQyZS1mNDQ5LTQwMTMtYWRkZC1lMzAwNjBlYjVhYTgiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzA1Mjg1NTQwLCJleHAiOjE3MDUzMTQzNDB9.S-jh2QShmoEL6Wcowj493e653BwkibubRntwvKcp1is",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          "if-none-match": 'W/"238f-9kF50U6kZ7yAkc2GPYGVIYYd2RM"',
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiZTE2ZWRiODRiNzRmYmY0MCIsInRyIjoiMGI0YjEzNmE0MTVjNzQ3OWY1Y2UwOWQ1MjZkNWVmMDAiLCJ0aSI6MTcwNTI4NjQ4ODE2N319",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-0b4b136a415c7479f5ce09d526d5ef00-e16edb84b74fbf40-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-e16edb84b74fbf40----1705286488167",
          Referer: "https://iboard.ssi.com.vn/",
        },
        body: null,
        method: "GET",
      }
    );
    // console.log(response.body);

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
          console.log("data: ", data);
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          console.log("jsonObject: ", jsonObject);
          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          console.log("dataNews: ", dataNews);
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          await query("DELETE FROM stock_price WHERE symbol = ?", [symbol]);
          await query("INSERT INTO stock_price VALUES ?", [dataNewsMap]);

          return data;
        } catch (error) {
          // console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
          console.log("ERROR -> skip");
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

getNewsDaily();
