const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
const moment = require("moment/moment");

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
    await getCoDong(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getCoDong = async (symbol) => {
  try {
    const response = await axios.get(
      `https://fwtapi3.fialda.com/api/services/app/StockInfo/GetMajorShareHolders?symbol=${symbol}`
    );

    const data = response?.data?.result;
    let dataMap = data?.map((item) => {
      return {
        ...item,
        symbol,
        isIndividual: item?.isIndividual ? 1 : 0,
      };
    });
    let dataCoDongMap = dataMap.map((item) => {
      // return [...Object.values(item)];
      return [
        item?.id,
        item?.isIndividual,
        item?.name,
        item?.avatar,
        item?.position,
        item?.ownership,
        item?.shares,
        item?.updatedDate,
        item?.symbol,
        item?.exchange,
        null,
      ];
    });
    // console.log("dataCoDongMap: ", dataCoDongMap);
    await query(
      "INSERT INTO co_dong (id, isIndividual, `name`, avatar, position, ownership, shares, updateDate, `symbol`, exchange, co_dong_id   ) VALUES ?",
      [dataCoDongMap]
    );
    return data;
  } catch (error) {
    // console.error("Error: ", error);
    return null;
  }
};

// getCoDong("SSI");
