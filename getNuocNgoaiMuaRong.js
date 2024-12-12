const { axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");
const { default: Axios } = require("axios");

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://finfo-api.vndirect.com.vn/v4/foreigns?q=code:STOCK_HNX,STOCK_UPCOM,STOCK_HOSE,ETF_HOSE,IFC_HOSE&sort=tradingDate&size=100`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  console.log("response: ", response);

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM nuoc_ngoai_all");
  //insert new data
  await query("INSERT INTO nuoc_ngoai_all VALUES ?", [dataMap]);
})();
