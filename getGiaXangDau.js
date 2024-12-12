const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  let response = await Axios.get(
    "https://chogia.vn/gia-xang-dau-vung-1-vung-2-gom-nhung-tinh-nao-15010"
  );

  const html = response?.data;

  const $ = cheerio.load(html);
  const petrolPrices = [];
  $("table.tbl_style_embed tbody tr").each((index, element) => {
    const petroName = $(element).find("td").eq(0).text().trim();
    const area1 = $(element).find("td").eq(1).text().trim();
    const area2 = $(element).find("td").eq(2).text().trim();

    const data = {
      petroName,
      area1,
      area2,
    };
    petrolPrices.push(data);
  });
  console.log(petrolPrices);
  let dataMap = petrolPrices.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM gia_xang_dau");
  //insert new data
  await query("INSERT INTO gia_xang_dau VALUES ?", [dataMap]);
})();
