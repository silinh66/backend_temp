const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  let response = await Axios.get("https://chogia.vn/ty-gia/vietcombank");

  const html = response?.data;

  const $ = cheerio.load(html);
  const exchangeRates = [];

  $("table#tbl_ty_gia tbody tr").each((index, element) => {
    const currencyCode = $(element).find("td").eq(0).text().trim();
    const currencyName = $(element).find("td").eq(1).text().trim();
    const buy = $(element).find("td").eq(2).text().trim();
    const sell = $(element).find("td").eq(3).text().trim();
    const transfer = $(element).find("td").eq(4).text().trim();

    exchangeRates.push({
      currencyCode,
      currencyName,
      buy,
      sell,
      transfer,
    });
  });
  console.log("exchangeRates: ", exchangeRates);

  let dataMap = exchangeRates.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM ty_gia_ngoai_te");
  //insert new data
  await query("INSERT INTO ty_gia_ngoai_te VALUES ?", [dataMap]);
})();
