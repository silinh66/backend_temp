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
  // console.log(listSymbolData.length);
  for (let i = 0; i < listSymbolData.length; i++) {
    const symbol = listSymbolData[i]?.Symbol;
    console.log(symbol);
    await getBCTC(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getBCTC = async (symbol) => {
  try {
    const response = await fetch(
      `https://fiin-fundamental.ssi.com.vn/FinancialStatement/GetIncomeStatement?language=vi&OrganCode=${symbol}`,
      {
        headers: {
          accept: "application/json",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
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
          //   console.log("decompressedString: ", decompressedString);

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;
          let dataResponse = jsonObject?.items;
          if (!dataResponse) return;
          let dataQuy = dataResponse?.map((item) => item?.yearly);
          if (!dataQuy) return;
          let dataQuyFilter = dataQuy[0]?.filter(
            (item) => item?.yearReport === 2023 && item?.quarterReport === 5
          );
          console.log("dataQuyFilter: ", dataQuyFilter);
          if (!dataQuyFilter) return;
          let listKey = Object.keys(dataQuyFilter[0]);
          console.log("listKey: ", listKey);
          let dataQuyMap = dataQuyFilter?.map((item) => {
            return [...Object.values(item)];
          });
          // console.log("dataQuyMap: ", dataQuyMap);

          // console.log("dataQuyMap: ", dataQuyMap[0]?.length);
          console.log("dataQuyMap?.length: ", dataQuyMap?.length);
          // insert new data
          if (dataQuyMap?.length > 0)
            await query("INSERT INTO ket_qua_kinh_doanh VALUES ?", [
              dataQuyMap,
            ]);
          //   let dataNam = dataResponse?.map((item) => item?.yearly);
          //   let dataNamFilter = dataNam[0]?.filter(
          //     (item) => item?.yearReport === 2023 && item?.quarterReport === 5
          //   );
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
};

// getBCTC("BVH");
