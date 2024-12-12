const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://api2.giavang.net/v1/gold/last-price?codes[]=XAUUSD&codes[]=USDX&codes[]=SJL1L10&codes[]=SJHN&codes[]=SJDNG&codes[]=DOHNL&codes[]=DOHCML&codes[]=BTSJC&codes[]=PQHNVM&codes[]=VNGSJC&codes[]=VIETTINMSJC&codes[]=VNGN&codes[]=HANAGOLD&codes[]=BT9999NTT&codes[]=PQHN24NTT&codes[]=DOJINHTV`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  console.log("response: ", response);

  const listDataMap = response?.map((item, index) => {
    return [
      {
        id: item?.id,
        type_code: item?.type_code,
        type: item?.type,
        sell: item?.sell,
        buy: item?.buy,
        open_sell: item?.open_sell,
        open_buy: item?.open_buy,
        alter_sell: item?.alter_sell,
        sell_min: item?.sell_min,
        sell_max: item?.sell_max,
        alter_buy: item?.alter_buy,
        buy_min: item?.buy_min,
        buy_max: item?.buy_max,
        sell_avg: item?.sell_avg,
        buy_avg: item?.buy_avg,
        yesterday_sell: item?.yesterday_sell,
        yesterday_buy: item?.yesterday_buy,
        count_sell: item?.count_sell,
        count_buy: item?.count_buy,
        update_time: item?.update_time,
        create_day: item?.create_day,
        create_month: item?.create_month,
        create_year: item?.create_year,
      },
      ...item?.histories?.map((item, index) => {
        return {
          ...item,
          yesterday_buy: null,
        };
      }),
    ];
  });
  console.log("listDataMap: ", listDataMap);
  let dataMap = [].concat(...listDataMap);
  console.log("dataMap: ", dataMap);

  const queryString = `
  INSERT INTO gold_price (
    id, type_code, type, sell, buy, open_sell, open_buy, alter_sell,
    sell_min, sell_max, alter_buy, buy_min, buy_max, sell_avg, buy_avg,
    yesterday_sell, yesterday_buy, count_sell, count_buy, update_time,
    create_day, create_month, create_year
  ) VALUES ?`;

  // Preparing the values for batch insert
  const values = dataMap.map((item) => [
    item.id,
    item.type_code,
    item.type,
    item.sell,
    item.buy,
    item.open_sell,
    item.open_buy,
    item.alter_sell,
    item.sell_min,
    item.sell_max,
    item.alter_buy,
    item.buy_min,
    item.buy_max,
    item.sell_avg,
    item.buy_avg,
    item.yesterday_sell,
    item.yesterday_buy,
    item.count_sell,
    item.count_buy,
    item.update_time,
    item.create_day,
    item.create_month,
    item.create_year,
  ]);

  //delete old data
  await query("DELETE FROM gold_price");
  // Executing the batch insert
  await query(queryString, [values]);
  //   let dataMap = result.map((item) => {
  //     return [...Object.values(item)];
  //   });
  //   //delete old data
  //   await query("DELETE FROM gia_vang");
  //   //insert new data
  //   await query("INSERT INTO gia_vang VALUES ?", [dataMap]);
})();
