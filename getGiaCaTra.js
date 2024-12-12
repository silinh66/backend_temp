const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

function extractGoldPriceData(html) {
  const $ = cheerio.load(html);
  const goldPriceData = [];

  $("#gia-vang-table tbody tr").each((index, element) => {
    const $element = $(element);
    const brandName = $element.find("td").eq(0).text().trim();
    const buyPriceToday = $element.find("td").eq(1).text().trim().split(" ")[0]; // Remove any trailing characters like <span>
    const sellPriceToday = $element
      .find("td")
      .eq(2)
      .text()
      .trim()
      .split(" ")[0]; // Remove any trailing characters like <span>
    const buyPriceYesterday = $element.find("td").eq(3).text().trim();
    const sellPriceYesterday = $element.find("td").eq(4).text().trim();

    goldPriceData.push({
      brandName: brandName,
      buyPriceToday: buyPriceToday,
      sellPriceToday: sellPriceToday,
      buyPriceYesterday: buyPriceYesterday,
      sellPriceYesterday: sellPriceYesterday,
    });
  });

  return goldPriceData;
}

(async () => {
  // Simulate API response
  const apiResponse = await Axios.get(
    `https://tepbac.com/gia-thuy-san/history/14/ca-tra-tai-ao.html`
  ); // Your HTML response goes here
  const response = apiResponse?.data;
  console.log("response: ", response);
  // const result = extractGoldPriceData(response);
  // console.log("result: ", result);
  // let dataMap = result.map((item) => {
  //   return [...Object.values(item)];
  // });
  // //delete old data
  // await query("DELETE FROM gia_vang");
  // //insert new data
  // await query("INSERT INTO gia_vang VALUES ?", [dataMap]);
})();
