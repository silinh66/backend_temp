const axios = require("axios");
const query = require("./common/query");
const fs = require("fs");
const moment = require("moment");



let getInfo =async () => {
    let listSymbolData = [];

    let response = await axios.get(
      `http://localhost:3030/Securities?pageIndex=1&pageSize=1000`
    );
    listSymbolData = response?.data?.data || listSymbolData;
    //delay 5s
    await new Promise((resolve) => setTimeout(resolve, 5000));
    response = await axios.get(
      `http://localhost:3030/Securities?pageIndex=2&pageSize=1000`
    );
    listSymbolData = response.data.data
      ? [...listSymbolData, ...response.data.data]
      : listSymbolData;
    let listSymbolMap = listSymbolData.map((item) => {
      return {
        symbol: item?.Symbol,
        full_name: item?.Symbol,
        description: item?.StockName,
        exchange: item?.Market,
        type: "stock",
        exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
      };
    });
    console.log("listSymbolMap: ", listSymbolMap);

    let dataMap = listSymbolMap.map((item) => {
      return [null, ...Object.values(item)];
    });
     //delete all symbol_info
     await query("DELETE FROM symbol_info");
     //insert
     await query(
       "INSERT INTO symbol_info (id, symbol, full_name, description, exchange, type, exchange_logo) VALUES ?",
       [dataMap]
     );
    return listSymbolMap;
}

(async () => {
  await getInfo();
})()