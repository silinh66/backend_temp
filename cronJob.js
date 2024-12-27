const cron = require("node-cron");
const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");
const cheerio = require("cheerio");
const moment = require("moment");
const { groupBy } = require("lodash");
const fs = require("fs");

// 0 9 * * 1-5 nghĩa là 9:00 từ thứ Hai đến thứ Sáu
cron.schedule("0 9 * * 1-5", () => {
  truncateTable();
});

const truncateTable = async () => {
  const queryCommand = "TRUNCATE TABLE mua_ban_chu_dong";
  query(queryCommand);
};

//cronjob every 15 minutes
cron.schedule("*/15 * * * *", () => {
  getGiaVangNew();
  getTuDoanhRong();

  getGiaXangDau();
  getTyGiaNgoaiTe();
  // getTopGiaTriRongHNX();
  // getTopGiaTriRongHOSE();
  // getNewsAll();
});

//cronjob every 5 seconds
cron.schedule("*/5 * * * * *", () => {
  getIndexPointHOSE();
  getIndexPointHNX();
  // getNuocNgoai();
  // getTuDoanhRong();
  // getNuocNgoaiMuaRong();
  getChangeCount();
  getIboard();
});

//cronjob every 15 seconds
cron.schedule("*/15 * * * * *", () => {
  // getSignal();
  getNewsAll();
  getGiaVangNew();
  fetchThanhKhoanData("hose"); // Fetches latest for HOSE
  fetchThanhKhoanData("hnx"); // Fetches latest for HNX
  fetchThanhKhoanData("hose", true); // Fetches historical for HOSE
  fetchThanhKhoanData("hnx", true); // Fetches historical for HNX
});

//cronjob every day at 12:00 AM and 7:00 PM
cron.schedule("0 0 * * *", () => {
  getNewsDaily();
  // getTyGiaLaiSuatDaily();
  // getGiaVangDaily();
  getLaiSuatDaily();
});

/**
 * Fetch liquidity data for a given market index and date, and save it to the database.
 * @param {string} type - The market type ('hose' or 'hnx').
 * @param {boolean} historical - Whether to fetch historical data.
 */
const fetchThanhKhoanData = async (type, historical = false) => {
  const indexCode = type === "hose" ? "VNINDEX" : "HNX";
  const dateAdjustment = getDateAdjustment(historical);
  const url = buildApiUrl(indexCode, dateAdjustment, historical);

  try {
    const response = await axios.get(url);
    const data = response.data.data;
    if (data && data.length > 0) {
      await saveDataToDatabase(data, type, historical);
    }
  } catch (error) {
    console.error(
      "Failed to fetch or save liquidity data for",
      type,
      ":",
      error
    );
  }
};

/**
 * Returns the API URL based on the type of data requested.
 * @param {string} indexCode - The market index code.
 * @param {string} date - The date for the data request.
 * @param {boolean} historical - Whether the data is historical.
 * @return {string} The full API URL for the data request.
 */
function buildApiUrl(indexCode, date, historical) {
  const baseUrl = "https://api-finfo.vndirect.com.vn/v4/";
  const endpoint = historical
    ? "index_intraday_histories"
    : "index_intraday_latest";
  const fields = "tradingDate_Time,accumulatedVal";
  const size = "100000";
  return `${baseUrl}${endpoint}?sort=time:asc&q=code:${indexCode}~tradingDate:${date}&fields=${fields}&size=${size}`;
}

/**
 * Determines the date adjustment based on the current day and whether historical data is needed.
 * @param {boolean} historical - Whether the data is historical.
 * @return {string} The adjusted date in 'YYYY-MM-DD' format.
 */
function getDateAdjustment(historical) {
  const today = moment();
  if (!historical) {
    return today.format("YYYY-MM-DD");
  }

  switch (today.day()) {
    case 1: // Monday
      return today.subtract(3, "days").format("YYYY-MM-DD");
    case 0: // Sunday
      return today.subtract(3, "days").format("YYYY-MM-DD");
    case 6: // Saturday
      return today.subtract(2, "days").format("YYYY-MM-DD");
    default: // Tuesday, Wednesday, Thursday
      return today.subtract(1, "days").format("YYYY-MM-DD");
  }
}

/**
 * Save fetched data to the database.
 * @param {Array} data - The data to save.
 * @param {string} type - The market type ('hose' or 'hnx').
 */
const saveDataToDatabase = async (data, type, historical) => {
  const date_type = historical ? "historical" : "current";
  let dataMap = data?.map((item) => {
    return [type, ...Object.values(item), date_type];
  });
  const sql = `
      INSERT INTO thanh_khoan_data (type,  accumulatedVal,tradingDate_Time, date_type)
      VALUES ?
     
    `;
  await query("DELETE FROM thanh_khoan_data WHERE type = ? AND date_type = ?", [
    type,
    date_type,
  ]);
  await query(sql, [dataMap]);
};

function getPreviousDate() {
  const today = moment().day();
  let previousDate;
  switch (today) {
    case 1: // Monday
      previousDate = moment().subtract(3, "days").format("YYYY-MM-DD"); // Last Friday
      break;
    case 0: // Sunday
    case 6: // Saturday
    case 5: // Friday
      previousDate = moment().subtract(2, "days").format("YYYY-MM-DD");
      break;
    default: // Tuesday, Wednesday, Thursday
      previousDate = moment().subtract(1, "days").format("YYYY-MM-DD");
  }
  return previousDate;
}

async function getNuocNgoaiMuaRong() {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://finfo-api.vndirect.com.vn/v4/foreigns?q=code:STOCK_HNX,STOCK_UPCOM,STOCK_HOSE,ETF_HOSE,IFC_HOSE&sort=tradingDate&size=100`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM nuoc_ngoai_all");
  //insert new data
  await query("INSERT INTO nuoc_ngoai_all VALUES ?", [dataMap]);
}
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

// async function getNewsAll() {
//   let listPost = [];
//   const getListPost = async (sourceUrl) => {
//     const response = await axios.get(sourceUrl);
//     const html = response.data;
//     const $ = cheerio.load(html);

//     //   let listPost = [];
//     let promises = [];

//     try {
//       switch (sourceUrl) {
//         case "https://baochinhphu.vn":
//           $(".box-focus-item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".home__sfw-item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".box-item-top").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".home-box-related-item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".box-focus-item-sm").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".box-item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });

//           $(".box-item-sub-link").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 if (
//                   url.includes("en.baochinhphu.vn") ||
//                   url.includes("cn.baochinhphu.vn") ||
//                   url.includes("media.chinhphu.vn")
//                 ) {
//                   resolve();
//                 } else {
//                   const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                   const htmlDetail = responseDetail.data;
//                   const $Detail = cheerio.load(htmlDetail);
//                   let image = $Detail(".detail-content")
//                     ?.find("img")
//                     ?.attr("src");
//                   if (!image) {
//                     image = $Detail(".containe-777")?.find("img")?.attr("src");
//                   }
//                   let time = $Detail(".detail-time")
//                     ?.text()
//                     ?.trim()
//                     ?.replaceAll("\n", "")
//                     ?.replace(/\s+/g, " ");
//                   if (time === "") {
//                     time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                   }
//                   let description = $Detail(".detail-sapo")?.text()?.trim();
//                   if (description === "") {
//                     description = $Detail(".list__rf-sapo")?.text()?.trim();
//                   }
//                   listPost.push({
//                     title,
//                     url: `${sourceUrl}${url}`,
//                     image,
//                     time,
//                     description,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });
//           break;
//         case "https://chatluongvacuocsong.vn":
//           $(".section-news-main").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".card-title").text().trim();
//                 let url = $(element).find(".card-title > a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find(".px-1").text().trim();
//                 let description = $(element).find("p.fix-text3").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               })
//             );
//           });
//           $(".mini-news_item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".font-weight-bold").text().trim();
//                 let url = $(element).find(".font-weight-bold > a").attr("href");
//                 //   let image = $(element).find("img").attr("src");
//                 //   let time = $(element).find(".px-1").text().trim();
//                 //   let description = $(element).find("p.fix-text3").text().trim();
//                 if (!title || !url) {
//                   resolve();
//                 } else {
//                   listPost.push({
//                     title,
//                     url,
//                     image: null,
//                     time: null,
//                     description: null,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });
//           $(".section-news-list > div > div").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("h2").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 // let time = $(element).find(".px-1").text().trim();
//                 // let description = $(element).find("p.fix-text3").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time: null,
//                   description: null,
//                 });
//                 resolve();
//               })
//             );
//           });
//           break;
//         case "https://dautu.kinhtechungkhoan.vn":
//           $(".article-title").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".article-title > a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 // let time = $(element).find(".time").text().trim();
//                 let description = $(element)
//                   .find(".article-desc")
//                   .text()
//                   .trim();
//                 if (!title || !url) {
//                   resolve();
//                 } else {
//                   listPost.push({
//                     title,
//                     url,
//                     image: image ? image : null,
//                     time: null,
//                     description: description ? description : null,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });
//           $(".article").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".article-title > a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 // let time = $(element).find(".time").text().trim();
//                 // let description = $(element).find(".article-desc").text().trim();
//                 if (!title || !url) {
//                   resolve();
//                 } else {
//                   listPost.push({
//                     title,
//                     url,
//                     image: image ? image : null,
//                     time: null,
//                     description: null,
//                   });
//                   resolve();
//                 }
//               })
//             );
//           });
//           break;
//         case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn":
//           $(".position-relative").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a.title-link").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find("small").text().trim();
//                 let description = $(element).find(".sapo").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               })
//             );
//           });
//           $(".news-lg").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".text-secondary").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find("small").text().trim();
//                 let description = $(element).find(".m-0").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               })
//             );
//           });
//           $(".small-item").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find("a.text-secondary").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find("small").text().trim();
//                 //   let description = $(element).find(".sapo").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time,
//                   description: null,
//                 });
//                 resolve();
//               })
//             );
//           });
//           break;
//         case "https://doanhnhanvn.vn":
//           $(".story--highlight").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".story__title > a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find("time").text().trim();
//                 // let description = $(element).find("p").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time,
//                   description: null,
//                 });
//                 resolve();
//               })
//             );
//           });
//           $(".story").each((index, element) => {
//             promises.push(
//               new Promise(async (resolve) => {
//                 let title = $(element).find(".story__title > a").text().trim();
//                 let url = $(element).find("a").attr("href");
//                 let image = $(element).find("img").attr("src");
//                 let time = $(element).find("time").text().trim();
//                 // let description = $(element).find("p").text().trim();
//                 listPost.push({
//                   title,
//                   url,
//                   image,
//                   time: time ? time : null,
//                   description: null,
//                 });
//                 resolve();
//               })
//             );
//           });
//           break;
//         default:
//           break;
//       }
//     } catch (error) {
//       console.log("error: ");
//     }

//     // Wait for all promises to resolve
//     //   Promise.all(promises).then(() => {
//     //     console.log("listPost: ", listPost);
//     //     console.log("listPost.length: ", listPost.length);
//     //   });
//   };
//   await getListPost("https://baochinhphu.vn");
//   await getListPost("https://chatluongvacuocsong.vn");
//   await getListPost("https://dautu.kinhtechungkhoan.vn");
//   await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn");
//   await getListPost("https://doanhnhanvn.vn");

//   console.log("All posts collected: ", listPost.length);
//   //   console.log(listPost);

//   //remove duplicate posts base on title
//   let uniqueListPost = [];
//   let uniqueTitles = [];
//   listPost.forEach((post) => {
//     if (!uniqueTitles.includes(post.title)) {
//       uniqueListPost.push(post);
//       uniqueTitles.push(post.title);
//     }
//   });
//   console.log("Unique posts: ", uniqueListPost.length);

//   let uniqueListPostMap = uniqueListPost.map((item) => {
//     return [null, ...Object.values(item), moment().format("YYYY-MM-DD")];
//   });

//   //delete old data
//   await query("DELETE FROM news_all where date = ?", [
//     moment().format("YYYY-MM-DD"),
//   ]);
//   //insert new data
//   await query("INSERT INTO news_all VALUES ?", [uniqueListPostMap]);
// }

async function getNewsAll() {
  let listPost = [];
  const getListPost = async (sourceUrl) => {
    const response = await axios.get(sourceUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    //   let listPost = [];
    let promises = [];

    try {
      switch (sourceUrl) {
        case "https://doisongphapluat.com.vn/kinh-doanh-17.html":
          $("article").each((index, element) => {
            // Lấy title từ thẻ a trong phần tiêu đề của bài viết
            let title = $(element)
              .find(".title , .ti2, a")
              .attr("title")
              .trim();

            // Kiểm tra xem tiêu đề có chứa cụm từ "Lãi suất ngân hàng hôm nay" không
            if (title.includes("Lãi suất ngân hàng hôm nay")) {
              // Lấy URL của bài viết
              let url = $(element).find("a").attr("href").trim();
              let date = moment().format("DD-MM-YYYY");
              let time = `${date} 07:16`;
              let image = $(element).find("img").attr("data-src");
              if (!image) {
                // Nếu `data-src` không tồn tại, dùng thuộc tính `src`
                image = $(element).find("img").attr("src");
              }

              // Xóa bỏ hình ảnh base64 tạm thời nếu có
              if (image && image.startsWith("data:image")) {
                image = null;
              }

              // Nếu có ảnh, trim để xóa các khoảng trắng
              if (image) {
                image = image.trim();
              }

              let description = $(element).find("p").text().trim();
              let type = "Lãi suất";

              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://www.qdnd.vn/kinh-te/tin-tuc":
          $(".list-news-category article").each((index, element) => {
            // Lấy title từ thẻ h3 > a
            let title = $(element).find("h3 a").attr("title").trim();

            // Kiểm tra xem tiêu đề có chứa cụm từ "Giá vàng hôm nay" không
            if (title.includes("Giá vàng hôm nay")) {
              // Lấy URL từ thuộc tính href của thẻ a
              let url = $(element).find("h3 a").attr("href").trim();

              // Lấy image URL từ thẻ img trong div.article-thumbnail
              let image = $(element)
                .find(".article-thumbnail img")
                .attr("src")
                .trim();

              // Lấy description từ thẻ p đầu tiên có class hidden-xs (thường là mô tả)
              let description = $(element)
                .find("p.hidden-xs")
                .not(".pubdate")
                .text()
                .trim();
              let type = "Vàng";
              // Lấy thời gian từ thẻ p với class pubdate
              let time = $(element).find("p.pubdate").text().trim();

              // Kiểm tra nếu đầy đủ thông tin thì thêm vào mảng listPost
              if (title && url && image && description && time) {
                listPost.push({
                  title,
                  url,
                  image,
                  time,
                  description,
                  type,
                });
              }
            }
          });

          break;

        case "https://doanhnhanvn.vn/dau-tu/chung-khoan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                // let time = $(element)
                //   .find("div.story__meta time")
                //   .text()
                //   .trim();
                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Chứng khoán";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/dau-tu/bat-dong-san":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Bất động sản";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/chuyen-dong":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/m-a":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/phat-trien-ben-vung":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/tai-chinh-doanh-nghiep":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/dich-vu-tai-chinh":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Tài chính";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/ngan-hang":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Ngân hàng";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/tien-te":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Kinh tế việt nam";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/viet-nam/vi-mo":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Vĩ mô";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/kien-thuc-quan-tri":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/cong-dong-doanh-nhan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/nha-lanh-dao":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/goc-nhin-doanh-nhan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/dau-an-nam-chau":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/khoi-nghiep":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Khởi nghiệp";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/the-gioi/kinh-te-quoc-te":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Kinh tế quốc tế";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://baochinhphu.vn/kinh-te/chung-khoan.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết

            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Chứng khoán";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/ngan-hang.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Ngân hàng";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/thi-truong.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Kinh tế việt nam";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/xa-hoi.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Xã hội";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/khoi-nghiep.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Khởi nghiệp";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/bat-dong-san/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");

            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");

            const type = "Bất động sản";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/tai-chinh-ngan-hang/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;
            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Tài chính";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/kinh-te/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;
            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Kinh tế";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/van-hoa-doi-song/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Xã hội";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/doanh-nghiep--doanh-nhan/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Doanh nhân";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;

        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/vi-mo.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Vĩ mô";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/tai-chinh-doanh-nghiep.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Doanh nghiệp";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/kinh-te-quoc-te.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Kinh tế quốc tế";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/khoi-nghiep-sang-tao.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Khởi nghiệp";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        // case "https://baochinhphu.vn":
        //   $(".box-focus-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".home__sfw-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item-top").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".home-box-related-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-focus-item-sm").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item-sub-link").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   break;
        // case "https://chatluongvacuocsong.vn":
        //   $(".section-news-main").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".card-title").text().trim();
        //         let url = $(element).find(".card-title > a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find(".px-1").text().trim();
        //         let description = $(element).find("p.fix-text3").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".mini-news_item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".font-weight-bold").text().trim();
        //         let url = $(element).find(".font-weight-bold > a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         //   let time = $(element).find(".px-1").text().trim();
        //         //   let description = $(element).find("p.fix-text3").text().trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: null,
        //             time: null,
        //             description: null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   $(".section-news-list > div > div").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("h2").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".px-1").text().trim();
        //         // let description = $(element).find("p.fix-text3").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time: null,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        // case "https://dautu.kinhtechungkhoan.vn":
        //   $(".article-title").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".article-title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".time").text().trim();
        //         let description = $(element)
        //           .find(".article-desc")
        //           .text()
        //           .trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: image ? image : null,
        //             time: null,
        //             description: description ? description : null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   $(".article").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".article-title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".time").text().trim();
        //         // let description = $(element).find(".article-desc").text().trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: image ? image : null,
        //             time: null,
        //             description: null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   break;
        // case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn":
        //   $(".position-relative").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a.title-link").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         let description = $(element).find(".sapo").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".news-lg").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".text-secondary").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         let description = $(element).find(".m-0").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".small-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a.text-secondary").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         //   let description = $(element).find(".sapo").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        // case "https://doanhnhanvn.vn":
        //   $(".story--highlight").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".story__title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("time").text().trim();
        //         // let description = $(element).find("p").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".story").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".story__title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("time").text().trim();
        //         // let description = $(element).find("p").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time: time ? time : null,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        default:
          break;
      }
    } catch (error) {
      // console.log("error: ");
    }

    // Wait for all promises to resolve
    //   Promise.all(promises).then(() => {
    //     console.log("listPost: ", listPost);
    //     console.log("listPost.length: ", listPost.length);
    //   });
  };
  // await getListPost("https://doisongphapluat.com.vn/kinh-doanh-17.html");

  // await getListPost("https://www.qdnd.vn/kinh-te/tin-tuc");
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/kinh-te-quoc-te.htm"
  // );
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/tai-chinh-doanh-nghiep.htm"
  // );
  // await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn/vi-mo.htm");
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/khoi-nghiep-sang-tao.htm"
  // );

  await getListPost("https://chatluongvacuocsong.vn/doanh-nghiep--doanh-nhan/");
  await getListPost("https://chatluongvacuocsong.vn/van-hoa-doi-song/");
  await getListPost("https://chatluongvacuocsong.vn/kinh-te/");
  await getListPost("https://chatluongvacuocsong.vn/tai-chinh-ngan-hang/");
  await getListPost("https://chatluongvacuocsong.vn/bat-dong-san/");
  await getListPost("https://baochinhphu.vn/kinh-te/khoi-nghiep.htm");
  await getListPost("https://baochinhphu.vn/xa-hoi.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/thi-truong.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/ngan-hang.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/chung-khoan.htm");
  await getListPost("https://doanhnhanvn.vn/the-gioi/kinh-te-quoc-te");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/khoi-nghiep");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/dau-an-nam-chau");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/goc-nhin-doanh-nhan");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/nha-lanh-dao");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/cong-dong-doanh-nhan");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/kien-thuc-quan-tri");
  await getListPost("https://doanhnhanvn.vn/viet-nam/vi-mo");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/tien-te");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/ngan-hang");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/dich-vu-tai-chinh");
  // await getListPost(
  //   "https://doanhnhanvn.vn/doanh-nghiep/tai-chinh-doanh-nghiep"
  // );
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/phat-trien-ben-vung");
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/m-a");
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/chuyen-dong");
  // await getListPost("https://doanhnhanvn.vn/dau-tu/chung-khoan");
  // await getListPost("https://doanhnhanvn.vn/dau-tu/bat-dong-san");

  // await getListPost("https://baochinhphu.vn");
  // await getListPost("https://chatluongvacuocsong.vn");
  // await getListPost("https://dautu.kinhtechungkhoan.vn");
  // await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn");
  // await getListPost("https://doanhnhanvn.vn");

  // console.log("All posts collected: ", listPost.length);
  //   console.log(listPost);

  //remove duplicate posts base on title
  let uniqueListPost = [];
  let uniqueTitles = [];
  listPost.forEach((post) => {
    if (!uniqueTitles.includes(post.title)) {
      uniqueListPost.push(post);
      uniqueTitles.push(post.title);
    }
  });
  // console.log("Unique posts: ", uniqueListPost.length);

  let uniqueListPostMap = uniqueListPost.map((item) => {
    return [null, ...Object.values(item), moment().format("YYYY-MM-DD")];
  });
  // console.log("uniqueListPostMap: ", uniqueListPostMap);

  //delete old data
  await query(
    "DELETE FROM news_all where (date = ? OR date = ? OR date = ?) ",
    // "SELECT * FROM news_all where url LIKE '%https://baochinhphu.vn%' AND (date = ? OR date = ?) ",
    [
      moment().format("YYYY-MM-DD"),
      moment().subtract(1, "days").format("YYYY-MM-DD"),
      moment().subtract(2, "days").format("YYYY-MM-DD"),
    ]
  );
  //insert new data
  await query(
    "INSERT INTO news_all (id, title, url, image, time, description, type, date) VALUES ?",
    [uniqueListPostMap]
  );
}

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

const getTopGiaTriRongHNX = async () => {
  // Simulate API response
  let body = [
    {
      text: "NETFOREIGN_HNX_VOL_1D_BUY",
      cachedTime: null,
    },
    {
      text: "NETFOREIGN_HNX_VOL_1D_SALE",
      cachedTime: null,
    },
    //   {
    //     "text": "CHANGEPERCENT_HSX_HNX_UPCOM_1M",
    //     "cachedTime": null
    //   },
    //   {
    //     "text": "CASHDIVIDENDYIELD_CURRENTPRICE",
    //     "cachedTime": null
    //   }
  ];
  const apiResponse = await axios.post(
    `https://fwtapi2.fialda.com/api/services/app/Stock/GetMarketAnalysises`,
    body
  ); // Your HTML response goes here
  const response = apiResponse?.data?.result;
  //   console.log("response: ", response);
  let netForeignBuy = response?.NETFOREIGN_HNX_VOL_1D_BUY?.data;
  let netForeignSale = response?.NETFOREIGN_HNX_VOL_1D_SALE?.data;
  let dataMapBuy = netForeignBuy?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_mua_hnx");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_mua_hnx VALUES ?", [dataMapBuy]);
  let dataMapSell = netForeignSale?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_ban_hnx");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_ban_hnx VALUES ?", [dataMapSell]);
};

const getTopGiaTriRongHOSE = async () => {
  // Simulate API response
  let body = [
    {
      text: "NETFOREIGN_HSX_VOL_1D_BUY",
      cachedTime: null,
    },
    {
      text: "NETFOREIGN_HSX_VOL_1D_SALE",
      cachedTime: null,
    },
    //   {
    //     "text": "CHANGEPERCENT_HSX_HNX_UPCOM_1M",
    //     "cachedTime": null
    //   },
    //   {
    //     "text": "CASHDIVIDENDYIELD_CURRENTPRICE",
    //     "cachedTime": null
    //   }
  ];
  const apiResponse = await axios.post(
    `https://fwtapi2.fialda.com/api/services/app/Stock/GetMarketAnalysises`,
    body
  ); // Your HTML response goes here
  const response = apiResponse?.data?.result;
  //   console.log("response: ", response);
  let netForeignBuy = response?.NETFOREIGN_HSX_VOL_1D_BUY?.data;
  let netForeignSale = response?.NETFOREIGN_HSX_VOL_1D_SALE?.data;
  let dataMapBuy = netForeignBuy?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_mua_hose");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_mua_hose VALUES ?", [dataMapBuy]);
  let dataMapSell = netForeignSale?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM top_gdnn_rong_ban_hose");
  //insert new data
  await query("INSERT INTO top_gdnn_rong_ban_hose VALUES ?", [dataMapSell]);
};

const getTyGiaNgoaiTe = async () => {
  let response = await axios.get("https://chogia.vn/ty-gia/vietcombank");

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

  let dataMap = exchangeRates.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM ty_gia_ngoai_te");
  //insert new data
  await query("INSERT INTO ty_gia_ngoai_te VALUES ?", [dataMap]);
};

const getGiaVangDaily = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `
    https://dulieu.nguoiquansat.vn/ExchangeRate/TyGiaVang?_=1707984969720`
  ); // Your HTML response goes here
  const response = apiResponse?.data;
  const result = extractGoldPriceData(response);
  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM gia_vang");
  //insert new data
  await query("INSERT INTO gia_vang VALUES ?", [dataMap]);
};

const getSignal = async () => {
  const filters = await axios.get(
    "https://api.finpath.vn/api/signals?type=&group=&topMarketCap=&valueAvg5Session=&exchange=&watchlistIds=&pageSize=23&page=1&loadPoint=false&mode=custom&q=&sector="
  );
  let data = filters?.data?.data?.signals;

  let dataGroup = groupBy(data, "group");
  // console.log("dataGroup: ", dataGroup);
  let filterGroup = {
    rsi: dataGroup?.rsi,
    macd: dataGroup?.macd,
    ma: dataGroup?.ma,
    ema: dataGroup?.ema,
  };
  // console.log("filterGroup: ", filterGroup);
  let lineSignal = `${JSON.stringify(filterGroup)}\n`;
  fs.appendFileSync("matchSignal.txt", lineSignal);
};

const getGiaVangNew = async () => {
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://api2.giavang.net/v1/gold/last-price?codes[]=XAUUSD&codes[]=USDX&codes[]=SJL1L10&codes[]=SJHN&codes[]=SJDNG&codes[]=DOHNL&codes[]=DOHCML&codes[]=BTSJC&codes[]=PQHNVM&codes[]=VNGSJC&codes[]=VIETTINMSJC&codes[]=VNGN&codes[]=HANAGOLD&codes[]=BT9999NTT&codes[]=PQHN24NTT&codes[]=DOJINHTV`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;

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
    let dataMap = [].concat(...listDataMap);

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

    if (values?.lenth > 0) {
      //delete old data
      await query("DELETE FROM gold_price");
      // Executing the batch insert
      await query(queryString, [values]);
      console.log("Update gold price successfully");
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

const getTyGiaLaiSuatDaily = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://dulieu.nguoiquansat.vn/ExchangeRate/TyGiaLaiSuat?_=1707971166904`
  ); // Your HTML response goes here
  const response = apiResponse?.data;

  const result = extractBankData(response);
  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM ty_gia_lai_suat");
  //insert new data
  await query("INSERT INTO ty_gia_lai_suat VALUES ?", [dataMap]);
};

const getLaiSuatDaily = async () => {
  let response = await axios.get("https://chogia.vn/lai-suat/");

  // Your HTML string
  const html = response?.data; // Replace `...` with your actual HTML content

  // Load the HTML string into cheerio
  const $ = cheerio.load(html);

  // Initialize an empty array to hold the data
  const data = [];
  const dataOnline = [];

  // Parse the table rows
  $("table#offline-tbl tbody tr").each((index, element) => {
    // Skip the last row which contains the update time
    if (!$(element).hasClass("cg_credit")) {
      const bankName = $(element).find("td.sticky_col a").text().trim();
      const values = $(element)
        .find("td.price")
        .map((i, el) => $(el).text().trim() || null)
        .get();

      // Push a new object into the data array
      data.push({
        bankName,
        value0Month: values[0],
        value1Month: values[1],
        value3Month: values[2],
        value6Month: values[3],
        value9Month: values[4],
        value12Month: values[5],
        value13Month: values[6],
        value18Month: values[7],
        value24Month: values[8],
        value36Month: values[9],
        // timeUpdate will be added after this loop
      });
    }
  });
  $("table#online-tbl tbody tr").each((index, element) => {
    // Skip the last row which contains the update time
    if (!$(element).hasClass("cg_credit")) {
      const bankName = $(element).find("td.sticky_col a").text().trim();
      const values = $(element)
        .find("td.price")
        .map((i, el) => $(el).text().trim() || null)
        .get();

      // Push a new object into the data array
      dataOnline.push({
        bankName,
        value0Month: values[0],
        value1Month: values[1],
        value3Month: values[2],
        value6Month: values[3],
        value9Month: values[4],
        value12Month: values[5],
        value13Month: values[6],
        value18Month: values[7],
        value24Month: values[8],
        value36Month: values[9],
        // timeUpdate will be added after this loop
      });
    }
  });

  // Parse the update time
  const timeUpdate = $("table#offline-tbl tbody tr.cg_credit td")
    .text()
    .replace("Chợ Giá cập nhật lúc ", "")
    .trim();

  // Add the timeUpdate to each object in the data array
  data.forEach((obj) => (obj.timeUpdate = timeUpdate));
  dataOnline.forEach((obj) => (obj.timeUpdate = timeUpdate));

  // Output the result
  let filterData = data.filter((item) => item.bankName !== "");
  let filterDataOnline = dataOnline.filter((item) => item.bankName !== "");

  let dataMap = filterData.map((item) => {
    return [...Object.values(item)];
  });
  let dataMapOnline = filterDataOnline.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM lai_suat");
  //insert new data
  await query("INSERT INTO lai_suat VALUES ?", [dataMap]);

  //delete old data
  await query("DELETE FROM lai_suat_online");
  //insert new data
  await query("INSERT INTO lai_suat_online VALUES ?", [dataMapOnline]);
};

const getGiaXangDau = async () => {
  let response = await axios.get(
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
  let dataMap = petrolPrices.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM gia_xang_dau");
  //insert new data
  await query("INSERT INTO gia_xang_dau VALUES ?", [dataMap]);
};

const getIndexPointHOSE = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/leaderlarger?index=VNINDEX`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  // Sắp xếp mảng theo giá trị tuyệt đối của point từ lớn đến nhỏ
  // Tách mảng thành 2 phần: giá trị dương và giá trị âm
  let positivePoints = response
    ?.filter((item) => item.point > 0)
    .sort((a, b) => b.point - a.point);
  let negativePoints = response
    ?.filter((item) => item.point < 0)
    .sort((a, b) => a.point - b.point);

  // Lấy 10 giá trị dương lớn nhất và 10 giá trị âm bé nhất
  let top10Positive = positivePoints?.slice(0, 10);
  let top10Negative = negativePoints?.slice(0, 10);

  // Kết hợp 2 mảng lại với nhau
  let result = top10Positive?.concat(top10Negative);

  let dataMap = result?.map((item) => {
    return [...Object.values(item)];
  });

  if (dataMap?.length > 0) {
    //delete old data
    await query("DELETE FROM top20_hose");
    //insert new data
    await query("INSERT INTO top20_hose VALUES ?", [dataMap]);
  } else {
    //delete old data
    await query("DELETE FROM top20_hose");
  }
};

const getIndexPointHNX = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/leaderlarger?index=HNX`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
  // Sắp xếp mảng theo giá trị tuyệt đối của point từ lớn đến nhỏ
  // Tách mảng thành 2 phần: giá trị dương và giá trị âm
  let positivePoints = response
    ?.filter((item) => item.point > 0)
    .sort((a, b) => b.point - a.point);
  let negativePoints = response
    ?.filter((item) => item.point < 0)
    .sort((a, b) => a.point - b.point);

  // Lấy 10 giá trị dương lớn nhất và 10 giá trị âm bé nhất
  let top10Positive = positivePoints?.slice(0, 10);
  let top10Negative = negativePoints?.slice(0, 10);

  // Kết hợp 2 mảng lại với nhau
  let result = top10Positive?.concat(top10Negative);

  let dataMap = result?.map((item) => {
    return [...Object.values(item)];
  });

  if (dataMap?.length > 0) {
    //delete old data
    await query("DELETE FROM top20_hnx");
    //insert new data
    await query("INSERT INTO top20_hnx VALUES ?", [dataMap]);
  } else {
    //delete old data
    await query("DELETE FROM top20_hose");
  }
};

const getChangeCount = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/gainerslosers?index=VNINDEX`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;
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
  const apiResponseHNX = await axios.get(
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

  let dataMap = result.map((item) => {
    return [...Object.values(item)];
  });
  console.log("get change count complete: ");
  //delete old data
  await query("DELETE FROM change_count");
  //insert new data
  await query("INSERT INTO change_count VALUES ?", [dataMap]);
};

const getThanhKhoanHOSE = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://api-finfo.vndirect.com.vn/v4/index_intraday_latest?sort=time:asc&q=code:VNINDEX&fields=tradingDate_Time,accumulatedVal&size=100000`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  await query("DROP TEMPORARY TABLE IF EXISTS thanh_khoan_hose_temp");
  // Tạo bảng tạm và chèn dữ liệu mới
  await query(
    "CREATE TEMPORARY TABLE thanh_khoan_hose_temp LIKE thanh_khoan_hose"
  );
  await query("INSERT INTO thanh_khoan_hose_temp VALUES ?", [dataMap]);

  // Chuyển dữ liệu từ bảng tạm sang bảng chính
  await query(
    "RENAME TABLE thanh_khoan_hose TO old_thanh_khoan_hose, thanh_khoan_hose_temp TO thanh_khoan_hose"
  );

  // Xóa bảng cũ
  await query("DROP TABLE old_thanh_khoan_hose");
};

const getThanhKhoanHNX = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://api-finfo.vndirect.com.vn/v4/index_intraday_latest?sort=time:asc&q=code:HNX&fields=tradingDate_Time,accumulatedVal&size=100000`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  await query("DROP TEMPORARY TABLE IF EXISTS thanh_khoan_hnx_temp");
  await query(
    "CREATE TEMPORARY TABLE thanh_khoan_hnx_temp LIKE thanh_khoan_hnx"
  );
  await query("INSERT INTO thanh_khoan_hnx_temp VALUES ?", [dataMap]);
  await query(
    "RENAME TABLE thanh_khoan_hnx TO old_thanh_khoan_hnx, thanh_khoan_hnx_temp TO thanh_khoan_hnx"
  );
  await query("DROP TABLE old_thanh_khoan_hnx");
};

const getThanhKhoanHistoryHOSE = async () => {
  let previousDate = moment().subtract(1, "days").format("YYYY-MM-DD");
  // Simulate API response
  const apiResponse = await axios.get(
    `https://api-finfo.vndirect.com.vn/v4/index_intraday_histories?sort=time:asc&q=code:VNINDEX~tradingDate:${previousDate}&fields=tradingDate_Time,accumulatedVal&size=100000`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  await query("DROP TEMPORARY TABLE IF EXISTS thanh_khoan_history_hose_temp");
  await query(
    "CREATE TEMPORARY TABLE thanh_khoan_history_hose_temp LIKE thanh_khoan_history_hose"
  );
  await query("INSERT INTO thanh_khoan_history_hose_temp VALUES ?", [dataMap]);
  await query(
    "RENAME TABLE thanh_khoan_history_hose TO old_thanh_khoan_history_hose, thanh_khoan_history_hose_temp TO thanh_khoan_history_hose"
  );
  await query("DROP TABLE old_thanh_khoan_history_hose");
};

const getThanhKhoanHistoryHNX = async () => {
  let previousDate = moment().subtract(1, "days").format("YYYY-MM-DD");
  // Simulate API response
  const apiResponse = await axios.get(
    `https://api-finfo.vndirect.com.vn/v4/index_intraday_histories?sort=time:asc&q=code:HNX~tradingDate:${previousDate}&fields=tradingDate_Time,accumulatedVal&size=100000`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [...Object.values(item)];
  });
  await query("DROP TEMPORARY TABLE IF EXISTS thanh_khoan_history_hnx_temp");
  await query(
    "CREATE TEMPORARY TABLE thanh_khoan_history_hnx_temp LIKE thanh_khoan_history_hnx"
  );
  await query("INSERT INTO thanh_khoan_history_hnx_temp VALUES ?", [dataMap]);
  await query(
    "RENAME TABLE thanh_khoan_history_hnx TO old_thanh_khoan_history_hnx, thanh_khoan_history_hnx_temp TO thanh_khoan_history_hnx"
  );
  await query("DROP TABLE old_thanh_khoan_history_hnx");
};

const getNuocNgoai = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://finfo-api.vndirect.com.vn/v4/foreigns?q=code:STOCK_HNX,STOCK_UPCOM,STOCK_HOSE,ETF_HOSE,IFC_HOSE&sort=tradingDate&size=100`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let lastPrices = response?.slice(0, 5);

  let dataMap = lastPrices?.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM nuoc_ngoai");
  //insert new data
  await query("INSERT INTO nuoc_ngoai VALUES ?", [dataMap]);

  console.log("get nuoc ngoai complete");
};

const getTuDoanhRong = async () => {
  // Simulate API response
  const apiResponse = await axios.get(
    `https://finfo-api.vndirect.com.vn/v4/proprietary_trading?q=code:HNX,VNINDEX,UPCOM&sort=date:desc&size=600`
  ); // Your HTML response goes here
  const response = apiResponse?.data?.data;

  let dataMap = response?.map((item) => {
    return [null, ...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM tu_doanh_all");
  //insert new data
  await query(
    "INSERT INTO tu_doanh_all (id, code, type, floor, date,buyingVol, buyingVolPct, sellingVol, sellingVolPct, buyingVal, buyingValPct, sellingVal, sellingValPct, netVal, netVol ) VALUES ?",
    [dataMap]
  );
};

const getNewsDaily = async () => {
  let listSymbolData = [];

  let response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  );
  listSymbolData = response?.data?.data || listSymbolData;
  //wait 1s
  await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
  response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  );
  listSymbolData = response.data.data
    ? [...listSymbolData, ...response.data.data]
    : listSymbolData;
  for (let i = 0; i < listSymbolData.length; i++) {
    const symbol = listSymbolData[i]?.Symbol;
    await getNews(symbol);
    await getThongKeGiaoDich(symbol);
    // await getFinancialAnalysis(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
};

const getIboard = async () => {
  let response = await axios.get(`https://api.finpath.vn/api/stocks/iboard`);
  //write to iboard.json file
  fs.writeFileSync("iboard.json", JSON.stringify(response?.data?.data?.stocks));
  // console.log("response: ", response?.data?.data?.stocks);
};

const getNews = async (symbol) => {
  let curDay = new Date().toISOString().split("T")[0];
  let curDateSTring = curDay.split("-")[2];
  let curMonthString = curDay.split("-")[1];
  let curYearString = curDay.split("-")[0];
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/news?symbol=${symbol}&pageSize=100&page=1&fromDate=11%2F11%2F2022&toDate=${curDateSTring}%2F${curMonthString}%2F${curYearString}&language=vn`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiJiMjhkZDljNC0zYjQ5LTRlNmQtYjdlMC1kOTk0MWRhOTM5YzIiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzAwNzEyMDM5LCJleHAiOjE3MDA3NDA4Mzl9.DUoJ61Tc7bs0CJ1KBxC219fM7AbpG9VjoC5Kxelr6Kw",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiMWNhNjk2NjA3Njg2ODQ3NSIsInRyIjoiYzYyZjg3YjVjYjg5Mzc2NjQ3MzZiNWIxMjA0OTUyMDAiLCJ0aSI6MTcwMDcyMzE5NTAwNn19",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-c62f87b5cb8937664736b5b120495200-1ca6966076868475-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-1ca6966076868475----1700723195006",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          // await query("INSERT INTO news VALUES ?", [dataNewsMap]);
          //delete news where symbol = symbol then insert new news
          await query("DELETE FROM news WHERE symbol = ?", [symbol]);
          await query("INSERT INTO news VALUES ?", [dataNewsMap]);

          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getThongKeGiaoDich = async (symbol) => {
  try {
    let todayString = moment().format("DD%2FMM%2FYYYY");

    let twoYearsAgoDate = moment()
      .subtract(2, "years")
      .format("DD%2FMM%2FYYYY");
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/stock-price?symbol=SSI&page=1&pageSize=300&fromDate=${twoYearsAgoDate}&toDate=${todayString}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI4YzMxYmQyZS1mNDQ5LTQwMTMtYWRkZC1lMzAwNjBlYjVhYTgiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzA1Mjg1NTQwLCJleHAiOjE3MDUzMTQzNDB9.S-jh2QShmoEL6Wcowj493e653BwkibubRntwvKcp1is",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          "if-none-match": 'W/"238f-9kF50U6kZ7yAkc2GPYGVIYYd2RM"',
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiZTE2ZWRiODRiNzRmYmY0MCIsInRyIjoiMGI0YjEzNmE0MTVjNzQ3OWY1Y2UwOWQ1MjZkNWVmMDAiLCJ0aSI6MTcwNTI4NjQ4ODE2N319",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-0b4b136a415c7479f5ce09d526d5ef00-e16edb84b74fbf40-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-e16edb84b74fbf40----1705286488167",
          Referer: "https://iboard.ssi.com.vn/",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          await query("DELETE FROM stock_price WHERE symbol = ?", [symbol]);
          await query("INSERT INTO stock_price VALUES ?", [dataNewsMap]);
          console.log("Update stock price successfully");
          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getFinancialAnalysis = async (symbol) => {
  try {
    const response = await fetch(
      `https://fiin-fundamental.ssi.com.vn/FinancialAnalysis/GetFinancialRatioV2?language=vi&Type=Company&OrganCode=${symbol}&Timeline=2023_4&Timeline=2023_3&Timeline=2023_2&Timeline=2023_1&Timeline=2022_4&Timeline=2022_3&Timeline=2022_2&Timeline=2022_1&Timeline=2021_4&Timeline=2021_3&Timeline=2021_2&Timeline=2021_1`,
      {
        headers: {
          accept: "application/json",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-fiin-key": "KEY",
          "x-fiin-seed": "SEED",
          "x-fiin-user-id": "ID",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          if (!jsonObject?.items) return;
          let array = jsonObject?.items;
          let arrayFilter = array.filter((item) => {
            return item?.value?.organCode !== "EndOfData";
          });
          let lastItem = arrayFilter[arrayFilter.length - 1];
          let infoCompany = lastItem?.value;
          if (!infoCompany) return;
          infoCompany = {
            ...infoCompany,
            organCode: symbol,
          };
          //delete old data
          await query("DELETE FROM financial_analysis WHERE organCode = ?", [
            symbol,
          ]);
          await query("INSERT INTO financial_analysis  SET ?", [infoCompany]);

          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

// getNewsDaily();
