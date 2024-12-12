const axios = require("axios");
const cheerio = require("cheerio");

const getNewsDetail = async (url) => {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const title = $("h1.detail-title").text().trim();
  const introduction = $("h2.detail-sapo").text().trim();
  const date = $("div.detail-time").text().trim();

  const content = $("div.detail-mcontent").html();

  console.log(`Title: ${title}`);
  console.log(`Date: ${date}`);
  console.log(`Introduction: ${introduction}`);
  console.log(`Content: `, content);
};

getNewsDetail(
  "https://baochinhphu.vn/dua-ra-xet-xu-vi-pham-ve-chong-danh-bat-thuy-san-trai-phep-ngay-tu-1-8-102240617200314337.htm"
);
// getNewsDetail("https://nguoiquansat.vn/tan-chu-tich-nuoc-to-lam-thuc-hien-nghiem-tuc-day-du-nhiem-vu-quyen-han-cua-chu-tich-nuoc-da-duoc-hien-dinh-132534.html");
