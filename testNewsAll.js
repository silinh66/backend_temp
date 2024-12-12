const axios = require("axios");
const cheerio = require("cheerio");
let listPost = [];

const getListPost = async (sourceUrl) => {
  const response = await axios.get(sourceUrl);
  const html = response.data;
  const $ = cheerio.load(html);

  //   let listPost = [];
  let promises = [];

  try {
    switch (sourceUrl) {
      case "https://baochinhphu.vn":
        $(".box-focus-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".home__sfw-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item-top").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".home-box-related-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-focus-item-sm").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item-sub-link").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });
        break;
      case "https://chatluongvacuocsong.vn":
        $(".section-news-main").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".card-title").text().trim();
              let url = $(element).find(".card-title > a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find(".px-1").text().trim();
              let description = $(element).find("p.fix-text3").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".mini-news_item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".font-weight-bold").text().trim();
              let url = $(element).find(".font-weight-bold > a").attr("href");
              //   let image = $(element).find("img").attr("src");
              //   let time = $(element).find(".px-1").text().trim();
              //   let description = $(element).find("p.fix-text3").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: null,
                  time: null,
                  description: null,
                });
                resolve();
              }
            })
          );
        });
        $(".section-news-list > div > div").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("h2").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".px-1").text().trim();
              // let description = $(element).find("p.fix-text3").text().trim();
              listPost.push({
                title,
                url,
                image,
                time: null,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      case "https://dautu.kinhtechungkhoan.vn":
        $(".article-title").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".article-title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".time").text().trim();
              let description = $(element).find(".article-desc").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: image ? image : null,
                  time: null,
                  description: description ? description : null,
                });
                resolve();
              }
            })
          );
        });
        $(".article").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".article-title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".time").text().trim();
              // let description = $(element).find(".article-desc").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: image ? image : null,
                  time: null,
                  description: null,
                });
                resolve();
              }
            })
          );
        });
        break;
      case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn":
        $(".position-relative").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a.title-link").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              let description = $(element).find(".sapo").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".news-lg").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".text-secondary").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              let description = $(element).find(".m-0").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".small-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a.text-secondary").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              //   let description = $(element).find(".sapo").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      case "https://doanhnhanvn.vn":
        $(".story--highlight").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".story__title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("time").text().trim();
              // let description = $(element).find("p").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description: null,
              });
              resolve();
            })
          );
        });
        $(".story").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".story__title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("time").text().trim();
              // let description = $(element).find("p").text().trim();
              listPost.push({
                title,
                url,
                image,
                time: time ? time : null,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("error: ");
  }

  // Wait for all promises to resolve
  //   Promise.all(promises).then(() => {
  //     console.log("listPost: ", listPost);
  //     console.log("listPost.length: ", listPost.length);
  //   });
};

// getListPost("https://chatluongvacuocsong.vn");
// getListPost("https://baochinhphu.vn");
// getListPost("https://dautu.kinhtechungkhoan.vn");
// getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn");
// getListPost("https://doanhnhanvn.vn");

const main = async () => {
  await getListPost("https://baochinhphu.vn");
  await getListPost("https://chatluongvacuocsong.vn");
  await getListPost("https://dautu.kinhtechungkhoan.vn");
  await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn");
  await getListPost("https://doanhnhanvn.vn");

  console.log("All posts collected: ", listPost.length);
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
  console.log("Unique posts: ", uniqueListPost.length);
  //   console.log(uniqueListPost);
};

main();
