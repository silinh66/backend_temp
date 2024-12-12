const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

function extractBankData(html) {
  const $ = cheerio.load(html);
  const bankData = [];

  $("#lai-suat-table tbody tr").each((index, element) => {
    const $element = $(element);
    const bankName = $element.find("td").eq(0).text().trim();
    const oneMonthRate = $element.find("td").eq(1).text().trim();
    const sixMonthRate = $element.find("td").eq(2).text().trim();
    const twelveMonthRate = $element.find("td").eq(3).text().trim();

    bankData.push({
      bankName: bankName,
      "1month": oneMonthRate,
      "6month": sixMonthRate,
      "12month": twelveMonthRate,
    });
  });

  return bankData;
}

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://dulieu.nguoiquansat.vn/ExchangeRate/TyGiaLaiSuat?_=1707971166904`
  ); // Your HTML response goes here
  const response = apiResponse?.data;
  console.log("response: ", response);

  const result = extractBankData(response);
  console.log("result: ", result);
  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM ty_gia_lai_suat");
  //insert new data
  await query("INSERT INTO ty_gia_lai_suat VALUES ?", [dataMap]);
})();
