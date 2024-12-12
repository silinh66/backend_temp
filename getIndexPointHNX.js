const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/leaderlarger?index=HNX`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  //   console.log("response: ", response);
  // Sắp xếp mảng theo giá trị tuyệt đối của point từ lớn đến nhỏ
  // Tách mảng thành 2 phần: giá trị dương và giá trị âm
  let positivePoints = response
    .filter((item) => item.point > 0)
    .sort((a, b) => b.point - a.point);
  let negativePoints = response
    .filter((item) => item.point < 0)
    .sort((a, b) => a.point - b.point);

  // Lấy 10 giá trị dương lớn nhất và 10 giá trị âm bé nhất
  let top10Positive = positivePoints.slice(0, 10);
  let top10Negative = negativePoints.slice(0, 10);

  // Kết hợp 2 mảng lại với nhau
  let result = top10Positive.concat(top10Negative);
  console.log("result: ", result);

  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top20_hnx");
  //insert new data
  await query("INSERT INTO top20_hnx VALUES ?", [dataMap]);
})();
