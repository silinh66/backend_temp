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
    await getFinancialAnalysis(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
};

getNewsDaily();

const getFinancialAnalysis = async (symbol) => {
  try {
    const response = await fetch(
      `https://fiin-fundamental.ssi.com.vn/FinancialAnalysis/GetFinancialRatioV2?language=vi&Type=Company&OrganCode=${symbol}&Timeline=2023_4&Timeline=2023_3&Timeline=2023_2&Timeline=2023_1&Timeline=2022_4&Timeline=2022_3&Timeline=2022_2&Timeline=2022_1&Timeline=2021_4&Timeline=2021_3&Timeline=2021_2&Timeline=2021_1`,
      {
        headers: {
          accept: "application/json",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-fiin-key": "KEY",
          "x-fiin-seed": "SEED",
          "x-fiin-user-id": "ID",
          Referer: "https://iboard.ssi.com.vn/",
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

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject?.items) return;
          let array = jsonObject?.items;
          let arrayFilter = array.filter((item) => {
            return item?.value?.organCode !== "EndOfData";
          });
          let lastItem = arrayFilter[arrayFilter.length - 1];
          let infoCompany = lastItem?.value;
          if (!infoCompany) return;
          console.log("infoCompany: ", infoCompany);
          infoCompany = {
            ...infoCompany,
            organCode: symbol,
          };
          //delete old data
          await query("DELETE FROM financial_analysis WHERE organCode = ?", [
            symbol,
          ]);
          await query("INSERT INTO financial_analysis  SET ?", [infoCompany]);

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
