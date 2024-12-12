const fetch = require("node-fetch");
const zlib = require("zlib");
const { Readable } = require("stream");
const query = require("./common/query");
const axios = require("axios");
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
    await getCompanyInfo(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
};

// getNewsDaily();

const getCompanyInfo = async (symbol) => {
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/company-profile?symbol=${symbol}&language=vn`,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "cache-control": "max-age=0",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie:
            "_ga_KJHZVBRYTH=GS1.1.1693299087.1.1.1693299319.60.0.0; _gcl_au=1.1.1573205341.1701141237; _ga_BR358FQTBG=GS1.1.1701141233.3.1.1701141307.58.0.0; __cuid=2b5f998ea91b4bd892952805b0f4ca02; amp_fef1e8=b53bc194-299f-4a7e-b593-5660d69ed84eR...1hjruogr5.1hjruogr8.31.c.3d; _cfuvid=MD9hCT9_vacqxkmdS5L946aoYPixONaC6LYeyIKO_f4-1705528955486-0-604800000; _gid=GA1.3.1695639195.1705544989; sso.id_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5zc2kuY29tLnZuIiwic3ViIjoiMjMzNzE4IiwiYXVkIjoiTngwSUpoTXBwaEdpNmRmWSIsImlhdCI6MTcwNTU0NTkwNCwiZXhwIjoxNzM3MDgxOTA0fQ.hpmH95CH__0KH1ilQrAR8zfdN-AJO2ph2VltTA_qWI0; _ga_EXPYE7627Z=GS1.1.1705544984.87.1.1705545905.0.0.0; _ga=GA1.1.1434597638.1692668260; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI4MmU0MWVkNC1iYWQ0LTQ5NTUtOGJjNS1jMzc5ZWY0OTRhZTUiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6ImRlbW9fdHJhZGluZyIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzA1NTQ2MDQzLCJleHAiOjE3MDU1NzQ4NDN9.bCbFVTD6DDtqe4mXJkmkeOIYt-xkaf7PAmYeYEb4hgc; _ga_QZJBYSXQCG=GS1.1.1705553126.69.1.1705553220.0.0.0; _ga_N4QS6QWZH6=GS1.1.1705566229.107.1.1705566251.38.0.0; __cf_bm=G_s9xezI5wFg9ty1UrHA4tLUW8YTRQkEcP8Mc5VkUQo-1705570525-1-AQFnlZ/RpFXgTYhwEi4a/VxCva+QBSYk06VruOyY6EAs04becUnfg2gAB/7+Oh3GNXVkdwHK8erY80IjNa5gpH8=; cf_chl_3=c605e0f24f4b4cf; cf_clearance=YZkeya_3tEhUoIv88ZrQQ35j5N6uFXftfUqLMW_Bv4s-1705570701-1-AfKJ91cW7Mvz+ot/r2W6F0kMh+xc+/zlbZYDrYhJ7ek+suLXpwNli902r8YyUFAMYIkHJrLwUGvMsn0rYw0l86s=",
          Referer:
            "https://iboard-api.ssi.com.vn/statistics/company/company-profile?symbol=PVS&language=vn&__cf_chl_tk=UMlwr8IpNctFoq8Db_tMetxcazO2gAbs3l32D0YFqww-1705570701-0-gaNycGzNFJA",
          "Referrer-Policy": "same-origin",
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
          console.log("decompressedString: ", decompressedString);

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          let infoCompany = jsonObject?.data;
          if (!infoCompany) return;
          //delete old data
          await query("DELETE FROM info_company WHERE organCode = ?", [symbol]);

          await query("INSERT INTO info_company VALUES (?)", [
            Object.values(infoCompany),
          ]);

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

getCompanyInfo("PVS");
