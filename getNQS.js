const axios = require("axios");
const cheerio = require("cheerio");

async function scrapePosts() {
  try {
    const response = await axios.get("https://nguoiquansat.vn/");
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];

    $("ul li").each((index, element) => {
      const titleElement = $(element).find(".b-grid__title a");
      const title = titleElement.text().trim();
      const href = titleElement.attr("href");
      const thumbnailUrl = $(element).find(".b-grid__img img").attr("src");
      const descElement = $(element).find(".b-grid__desc");
      const description =
        descElement.length > 0 ? descElement.text().trim() : "";

      // Skip the post if title, href, or thumbnailUrl is empty
      if (title !== "" && href !== "" && thumbnailUrl !== "") {
        posts.push({
          title,
          href,
          thumbnailUrl,
          description,
        });
      }
    });

    return posts;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Usage
scrapePosts().then((posts) => {
  console.log("Posts:", posts);
});
