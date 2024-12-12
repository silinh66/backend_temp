const axios = require("axios");
const query = require("./common/query");
(async () => {
  // Simulate API response
  let body = [
    {
      text: "NETFOREIGN_HNX_VOL_1D_BUY",
      cachedTime: null,
    },
    {
      text: "NETFOREIGN_HNX_VOL_1D_SALE",
      cachedTime: null,
    },
    //   {
    //     "text": "CHANGEPERCENT_HSX_HNX_UPCOM_1M",
    //     "cachedTime": null
    //   },
    //   {
    //     "text": "CASHDIVIDENDYIELD_CURRENTPRICE",
    //     "cachedTime": null
    //   }
  ];
  const apiResponse = await axios.post(
    `https://fwtapi2.fialda.com/api/services/app/Stock/GetMarketAnalysises`,
    body
  ); // Your HTML response goes here
  const response = apiResponse?.data?.result;
  //   console.log("response: ", response);
  let netForeignBuy = response?.NETFOREIGN_HNX_VOL_1D_BUY?.data;
  console.log("netForeignBuy: ", netForeignBuy);
  let netForeignSale = response?.NETFOREIGN_HNX_VOL_1D_SALE?.data;
  console.log("netForeignSale: ", netForeignSale);
  let dataMapBuy = netForeignBuy?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_mua_hnx");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_mua_hnx VALUES ?", [dataMapBuy]);
  let dataMapSell = netForeignSale?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_ban_hnx");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_ban_hnx VALUES ?", [dataMapSell]);
})();
