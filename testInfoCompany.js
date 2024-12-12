const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
// (async () => {
//   let listSymbolData = [];

//   let response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
//   );
//   listSymbolData = response?.data?.data || listSymbolData;
//   response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
//   );
//   listSymbolData = response.data.data
//     ? [...listSymbolData, ...response.data.data]
//     : listSymbolData;
//   console.log(listSymbolData.length);
//   for (let i = 0; i < listSymbolData.length; i++) {
//     const symbol = listSymbolData[i]?.Symbol;
//     console.log(symbol);
//     await getCompanyInfo(symbol);
//     //wait 5s
//     await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
//   }
// })();

// const getCompanyInfo = async (symbol) => {
//   try {
//     const response = await fetch(
//       `https://iboard-api.ssi.com.vn/statistics/company/company-profile?symbol=${symbol}&language=vn`,
//       {
//         headers: {
//           accept: "application/json, text/plain, */*",
//           "accept-language": "vi",
//           authorization:
//             "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI0Y2Q0ZDVmNC00N2IxLTRhOWUtYWI3Ny02ZjllMmI1ZTU4YzIiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzAwNDY0MzA2LCJleHAiOjE3MDA0OTMxMDZ9.5yai_XX7wVmCcs3D4s5JHKcUohxf_8DAFJi1kMrGWMw",
//           "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
//           newrelic:
//             "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiOGFmN2JjYzg5OTM5NmNkMyIsInRyIjoiZTU1MDhmMmE4Yzk3ZjI4ODJkNTA2YTFlNTE4ZmU3MDAiLCJ0aSI6MTcwMDQ2NDkwNTU5MX19",
//           "sec-ch-ua":
//             '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
//           "sec-ch-ua-mobile": "?0",
//           "sec-ch-ua-platform": '"Windows"',
//           "sec-fetch-dest": "empty",
//           "sec-fetch-mode": "cors",
//           "sec-fetch-site": "same-site",
//           traceparent:
//             "00-e5508f2a8c97f2882d506a1e518fe700-8af7bcc899396cd3-01",
//           tracestate:
//             "3966840@nr=0-1-3966840-594433072-8af7bcc899396cd3----1700464905591",
//           Referer: "https://iboard.ssi.com.vn/",
//           "Referrer-Policy": "strict-origin-when-cross-origin",
//         },
//         body: null,
//         method: "GET",
//       }
//     );
//     // console.log(response);

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
//           console.log(jsonObject);
//           let infoCompany = jsonObject?.data;
//           if (!infoCompany) return;
//           await query("INSERT INTO info_company VALUES (?)", [
//             Object.values(infoCompany),
//           ]);

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

// (async () => {
//   let response = await fetch(
//     "https://core.fiintrade.vn/Master/GetListOrganization?language=vi",
//     {
//       headers: {
//         accept: "application/json, text/plain, */*",
//         "accept-language":
//           "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
//         authorization:
//           "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkFEMEJGODU0MDk5ODBCNTcyQTNCN0ZFMUJFOTQwNjcxRkNCMUJEMkQiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJyUXY0VkFtWUMxY3FPM19odnBRR2NmeXh2UzAifQ.eyJuYmYiOjE3MDA1MzY1NTIsImV4cCI6MTcwMDU2NTE1MiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmZpaW50cmFkZS52biIsImF1ZCI6WyJodHRwczovL2F1dGguZmlpbnRyYWRlLnZuL3Jlc291cmNlcyIsIkZpaW5UcmFkZS5NYXJrZXQiLCJGaWluVHJhZGUuQ29yZSIsIkZpaW5UcmFkZS5SZWFsdGltZSIsIkZpaW5UcmFkZS5GdW5kYW1lbnRhbCJdLCJjbGllbnRfaWQiOiJTdG94UGx1cy5GaWluVHJhZGUuU1BBIiwic3ViIjoiMjM2MDYzIiwiYXV0aF90aW1lIjoxNzAwNTM2NTUyLCJpZHAiOiJsb2NhbCIsInVzZXJfaWQiOiIyMzYwNjMiLCJ1c2VyX25hbWUiOiJzaWxpbmg2NkBnbWFpbC5jb20iLCJuYW1lIjoiIiwiZ2l2ZW5fbmFtZSI6IkxpbmgiLCJmYW1pbHlfbmFtZSI6IktlbiIsIm1pZGRsZV9uYW1lIjoiIiwiZW1haWwiOiJzaWxpbmg2NkBnbWFpbC5jb20iLCJzZXJ2aWNlX3R5cGUiOiJGaWluR3JvdXAuRmlpblRyYWRlIiwibGlzdF9wYWNrYWdlIjoiRmlpblRyYWRlLlRyaWFsIiwibGlzdF9mZWF0dXJlIjoiIiwibGlzdF9hcGkiOiIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJncm91cF9uYW1lIjoiSW5kaXZpZHVhbCIsInN0YXJ0X2RhdGUiOiIxMi8xMS8yMDIzIiwiZW5kX2RhdGUiOiIyNi8xMS8yMDIzIiwiaGl0Y291bnRfcGVybW9udGgiOiIwIiwiY29tZ3JvdXBfbGltaXQiOiIiLCJ0aWNrZXJfbGltaXQiOiIiLCJ0aW1lcmFuZ2VfbGltaXQiOiIwIiwiZGF0YXJhbmdlX2xpbWl0IjoiMCIsInBlcl9taW51dGUiOiIwIiwicGVyX2hvdXIiOiIwIiwicGVyX2RheSI6IjAiLCJwZXJfbW9udGgiOiIwIiwiZW5hYmxlZCI6IlRydWUiLCJsYXN0X2F0dGVtcHQiOiIxMS8xOC8yMDIzIDk6MzY6NTkgQU0iLCJsYXN0X2F0dGVtcHRfc3RhdHVzIjoiU1VDQ0VTUyIsImZpbmdlcnByaW50IjoiNTJkNjY4NWZjMmUxMTBlZDkxN2U5MzAxYmRjM2VkNWIiLCJjbGllbnR0eXBlIjoiV0VCQ0xJRU5UIiwic2NvcGUiOlsib3BlbmlkIiwiRmlpblRyYWRlLk1hcmtldCIsIkZpaW5UcmFkZS5Db3JlIiwiRmlpblRyYWRlLlJlYWx0aW1lIiwiRmlpblRyYWRlLkZ1bmRhbWVudGFsIl0sImFtciI6WyJwd2QiXX0.mBEfCE1baff8zgRXjsdWCBNCokGlBXUKuU3cwv-HvE4DsZlpTwZF8fUxoTJ6A3I7S04hSBaOSUSFBrISibi9H7GvIUKgz8xv6d1oPukZOdd4L7fCoWQcabADjEfWdBfouVIVYux8TYETWzcTFBps0qUL4hiDqdIu42_TBPydnR94Rnl-yIjM-3duM06r9bXd3587bMMjeIIoTruFsMXFX8Rw0s5XiX5A77bYYfN3z6FMv4ANTv-LQa6asZxTBLldIPnI9S5CXYiwPhTNIcGX9gshw5sIKwa2SCe0EV-bCDhVx7ryx5QBTITShkVQ5fPMh-4N8lZppO0u8yTe34SH_w",
//         "sec-ch-ua":
//           '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": '"Windows"',
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         Referer: "https://fiintrade.vn/",
//         "Referrer-Policy": "strict-origin-when-cross-origin",
//       },
//       body: null,
//       method: "GET",
//     }
//   );
//   if (response.body instanceof zlib.Gunzip) {
//     const gunzipStream = response.body;

//     // Tạo một readable stream từ gunzip stream
//     const readableStream = new Readable().wrap(gunzipStream);

//     let data = "";
//     readableStream.on("data", (chunk) => {
//       data += chunk;
//     });

//     readableStream.on("end", async () => {
//       try {
//         // Chuyển đổi dữ liệu đã giải nén thành chuỗi
//         const decompressedString = data.toString();

//         // Chuyển chuỗi JSON thành đối tượng
//         const jsonObject = JSON.parse(decompressedString);

//         // Sử dụng đối tượng jsonObject ở đây
//         // console.log(jsonObject);
//         let infoCompany = jsonObject?.items;
//         console.log("infoCompany: ", infoCompany);
//         if (!infoCompany) return;
//         let infoCompanyMap = infoCompany.map((item) => {
//           return Object.values(item);
//         });
//         await query("INSERT INTO organization VALUES ?", [infoCompanyMap]);

//         return data;
//       } catch (error) {
//         console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
//       }
//     });
//   }
// })();

// (async () => {
//   let listSymbolData = [];

//   let response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
//   );
//   listSymbolData = response?.data?.data || listSymbolData;
//   response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
//   );
//   listSymbolData = response.data.data
//     ? [...listSymbolData, ...response.data.data]
//     : listSymbolData;
//   console.log(listSymbolData.length);
//   for (let i = 0; i < listSymbolData.length; i++) {
//     const symbol = listSymbolData[i]?.Symbol;
//     console.log(symbol);
//     await getFinancialAnalysis(symbol);
//     //wait 5s
//     await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
//   }
// })();

// const getFinancialAnalysis = async (symbol) => {
//   try {
//     const response = await fetch(
//       `https://fiin-fundamental.ssi.com.vn/FinancialAnalysis/GetFinancialRatioV2?language=vi&Type=Company&OrganCode=${symbol}&Timeline=2023_4&Timeline=2023_3&Timeline=2023_2&Timeline=2023_1&Timeline=2022_4&Timeline=2022_3&Timeline=2022_2&Timeline=2022_1&Timeline=2021_4&Timeline=2021_3&Timeline=2021_2&Timeline=2021_1`,
//       {
//         headers: {
//           accept: "application/json",
//           "accept-language":
//             "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
//           "content-type": "application/json",
//           "sec-ch-ua":
//             '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
//           "sec-ch-ua-mobile": "?0",
//           "sec-ch-ua-platform": '"Windows"',
//           "sec-fetch-dest": "empty",
//           "sec-fetch-mode": "cors",
//           "sec-fetch-site": "same-site",
//           "x-fiin-key": "KEY",
//           "x-fiin-seed": "SEED",
//           "x-fiin-user-id": "ID",
//           Referer: "https://iboard.ssi.com.vn/",
//           "Referrer-Policy": "strict-origin-when-cross-origin",
//         },
//         body: null,
//         method: "GET",
//       }
//     );
//     // console.log(response);

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
//           if (!jsonObject?.items) return;
//           let array = jsonObject?.items;
//           let arrayFilter = array.filter((item) => {
//             return item?.value?.organCode !== "EndOfData";
//           });
//           let lastItem = arrayFilter[arrayFilter.length - 1];
//           let infoCompany = lastItem?.value;
//           if (!infoCompany) return;
//           console.log("infoCompany: ", infoCompany);
//           infoCompany = {
//             ...infoCompany,
//             organCode: symbol,
//           };
//           await query("INSERT INTO financial_analysis  SET ?", [infoCompany]);

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

// (async () => {
//   let listSymbolData = [];

//   let response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
//   );
//   listSymbolData = response?.data?.data || listSymbolData;
//   response = await axios.get(
//     `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
//   );
//   listSymbolData = response.data.data
//     ? [...listSymbolData, ...response.data.data]
//     : listSymbolData;
//   console.log(listSymbolData.length);
//   for (let i = 0; i < listSymbolData.length; i++) {
//     const symbol = listSymbolData[i]?.Symbol;
//     console.log(symbol);
//     await getBCTC(symbol);
//     //wait 5s
//     await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
//   }
// })();

const getBCTC = async (symbol) => {
  try {
    const response = await fetch(
      `https://fundamental.fiintrade.vn/FinancialStatement/GetFinancialReports?language=vi&OrganCode=${symbol}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          authorization:
            "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkFEMEJGODU0MDk5ODBCNTcyQTNCN0ZFMUJFOTQwNjcxRkNCMUJEMkQiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJyUXY0VkFtWUMxY3FPM19odnBRR2NmeXh2UzAifQ.eyJuYmYiOjE3MDA4MDgxNjUsImV4cCI6MTcwMDgzNjc2NSwiaXNzIjoiaHR0cHM6Ly9hdXRoLmZpaW50cmFkZS52biIsImF1ZCI6WyJodHRwczovL2F1dGguZmlpbnRyYWRlLnZuL3Jlc291cmNlcyIsIkZpaW5UcmFkZS5NYXJrZXQiLCJGaWluVHJhZGUuQ29yZSIsIkZpaW5UcmFkZS5SZWFsdGltZSIsIkZpaW5UcmFkZS5GdW5kYW1lbnRhbCJdLCJjbGllbnRfaWQiOiJTdG94UGx1cy5GaWluVHJhZGUuU1BBIiwic3ViIjoiMjM2MDYzIiwiYXV0aF90aW1lIjoxNzAwODA4MTY1LCJpZHAiOiJsb2NhbCIsInVzZXJfaWQiOiIyMzYwNjMiLCJ1c2VyX25hbWUiOiJzaWxpbmg2NkBnbWFpbC5jb20iLCJuYW1lIjoiIiwiZ2l2ZW5fbmFtZSI6IkxpbmgiLCJmYW1pbHlfbmFtZSI6IktlbiIsIm1pZGRsZV9uYW1lIjoiIiwiZW1haWwiOiJzaWxpbmg2NkBnbWFpbC5jb20iLCJzZXJ2aWNlX3R5cGUiOiJGaWluR3JvdXAuRmlpblRyYWRlIiwibGlzdF9wYWNrYWdlIjoiRmlpblRyYWRlLlRyaWFsIiwibGlzdF9mZWF0dXJlIjoiIiwibGlzdF9hcGkiOiIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJncm91cF9uYW1lIjoiSW5kaXZpZHVhbCIsInN0YXJ0X2RhdGUiOiIxMi8xMS8yMDIzIiwiZW5kX2RhdGUiOiIyNi8xMS8yMDIzIiwiaGl0Y291bnRfcGVybW9udGgiOiIwIiwiY29tZ3JvdXBfbGltaXQiOiIiLCJ0aWNrZXJfbGltaXQiOiIiLCJ0aW1lcmFuZ2VfbGltaXQiOiIwIiwiZGF0YXJhbmdlX2xpbWl0IjoiMCIsInBlcl9taW51dGUiOiIwIiwicGVyX2hvdXIiOiIwIiwicGVyX2RheSI6IjAiLCJwZXJfbW9udGgiOiIwIiwiZW5hYmxlZCI6IlRydWUiLCJsYXN0X2F0dGVtcHQiOiIxMS8xOC8yMDIzIDk6MzY6NTkgQU0iLCJsYXN0X2F0dGVtcHRfc3RhdHVzIjoiU1VDQ0VTUyIsImZpbmdlcnByaW50IjoiIiwiY2xpZW50dHlwZSI6IiIsInNjb3BlIjpbIm9wZW5pZCIsIkZpaW5UcmFkZS5NYXJrZXQiLCJGaWluVHJhZGUuQ29yZSIsIkZpaW5UcmFkZS5SZWFsdGltZSIsIkZpaW5UcmFkZS5GdW5kYW1lbnRhbCJdLCJhbXIiOlsicHdkIl19.Ti2CZDLsptOAb0mOBaPBSbuveer6oBp5Yx1oFPmf20x-ouQWLeJVwfd8PgLT-GaaCVd9y1_SCFVl94KlZaGvLNnzeVHsjNFBkVEuDil-QAcpjJkcH4Ix6hHUKQSuaIYLUKfQkvKtzMyOqTQ9hZstnjFh5AzSGf7U_-UaYi3HQtu12_1S1rc2alJp7UNtLoK6_NHh3M5D9RSwYAl72K3ThglSmeghaFjWLuBlcAtaF-g8DOJj4rURGr9lAQp6Bb_j51upMGJ4pv-dSTRqWVfi-GwcinCEGNF4pVCpwR-mUxEeWF1RKgCpvg87BptAPHvsPk5SSqZUexrd_GNOg50WaA",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          Referer: "https://fiintrade.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    // console.log(response);

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
          if (!jsonObject) return;

          let dataReport = jsonObject?.items;
          if (!dataReport) return;
          if (dataReport?.length === 0) return;
          console.log("dataReport: ", dataReport);
          let dataReportMap = dataReport.map((item) => {
            return Object.values(item);
          });
          // await query("INSERT INTO reports VALUES ?", [dataReportMap]);

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

getBCTC("SSI");
