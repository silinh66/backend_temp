const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/gainerslosers?index=VNINDEX`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  console.log("response: ", response);
  let lastItem =
    response?.length > 0
      ? response[response.length - 1]
      : {
          index: "VNINDEX",
          noChange: 0,
          decline: 0,
          advance: 0,
          time: "09:10:10",
        };
  const apiResponseHNX = await Axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/gainerslosers?index=HNX`
  ); // Your HTML response goes here
  const responseHNX = apiResponseHNX?.data?.data;
  let lastItemHNX =
    responseHNX?.length > 0
      ? responseHNX[responseHNX.length - 1]
      : {
          index: "HNX",
          noChange: 0,
          decline: 0,
          advance: 0,
          time: "09:10:10",
        };

  let result = [lastItem, lastItemHNX];
  console.log("result: ", result);

  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  console.log("dataMap: ", dataMap);
  //delete old data
  await query("DELETE FROM change_count");
  //insert new data
  await query("INSERT INTO change_count VALUES ?", [dataMap]);
})();
