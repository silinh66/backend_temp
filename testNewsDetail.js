const axios = require("axios");
const cheerio = require("cheerio");

(async () => {
  const url =
    "https://nguoiquansat.vn/tan-chu-tich-nuoc-to-lam-thuc-hien-nghiem-tuc-day-du-nhiem-vu-quyen-han-cua-chu-tich-nuoc-da-duoc-hien-dinh-132534.html";
  // "https://nguoiquansat.vn/chuyen-gia-chi-ra-phan-khuc-bds-duoc-ky-vong-troi-day-va-cat-canh-trong-tuong-lai-132504.html";
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const title =
    $("h1.c-detail-head__title").text().trim() ||
    $(".sc-longform-header-title").text().trim();
  const date =
    $("span.c-detail-head__time").text().trim() ||
    $(".sc-longform-header-date").text().trim();
  const author =
    $("span.c-detail-head__cat").text().trim() ||
    $(".c-longform-header-author").text();
  const introduction = $("b").first().text().trim();

  const content = [];
  $(".entry p").each((i, el) => {
    const paragraph = $(el).text().trim();
    if (paragraph) content.push(paragraph);
  });

  const images = [];
  $(".entry figure.expNoEdit").each((i, el) => {
    const imgSrc = $(el).find("img").attr("src");
    const caption = $(el).find(".lg-caption h2").text().trim();
    images.push({ imgSrc, caption });
  });

  const originalSource = $("span.btn span").text().trim();
  const originalLink = $("#url-copy").text().trim();

  console.log(`Title: ${title}`);
  console.log(`Date: ${date}`);
  console.log(`Author: ${author}`);
  console.log(`Introduction: ${introduction}`);
  console.log(`Content: `, content);
  console.log(`Images: `, images);
  console.log(`Original Source: ${originalSource}`);
  console.log(`Original Link: ${originalLink}`);
})();
