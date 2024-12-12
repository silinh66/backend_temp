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
    await getBaoCaoPhanTich(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getBaoCaoPhanTich = async (symbol) => {
  try {
    const response = await axios.get(
      `https://api.finpath.vn/api/analysisreports/${symbol}`
    );
    let dataBaoCaoPhanTich = response.data?.data?.reports;
    if (!dataBaoCaoPhanTich) {
      return null;
    }
    if (dataBaoCaoPhanTich.length === 0) {
      return null;
    }
    let dataBaoCaoPhanTichMap = dataBaoCaoPhanTich.map((item) => {
      return [
        null,
        item?._id,
        item?.code,
        item?.attachedLink,
        item?.fileName,
        item?.issueDate,
        item?.recommend,
        item?.source,
        item?.title,
      ];
    });
    await query("DELETE FROM bao_cao_phan_tich WHERE code = ?", [symbol]);
    await query(
      `INSERT INTO bao_cao_phan_tich (

          ) VALUES ?`,
      [dataBaoCaoPhanTichMap]
    );

    return dataBaoCaoPhanTich;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// getBaoCaoPhanTich("SSI");
