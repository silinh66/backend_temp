const { axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");
const { default: Axios } = require("axios");
const moment = require("moment");

(async () => {
  let previousDate = moment().subtract(1, "days").format("YYYY-MM-DD");
  // Simulate API response
  const apiResponse = await Axios.get(
    `
    https://api-finfo.vndirect.com.vn/v4/index_intraday_histories?sort=time:asc&q=code:HNX~tradingDate:${previousDate}&fields=tradingDate_Time,accumulatedVal&size=100000`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  console.log("response: ", response);

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM thanh_khoan_history_hnx");
  //insert new data
  await query("INSERT INTO thanh_khoan_history_hnx VALUES ?", [dataMap]);
})();
