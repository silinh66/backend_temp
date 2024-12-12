const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeContent() {
  try {
    const response = await axios.get(
      "https://nguoiquansat.vn/sasco-cua-vua-hang-hieu-johnathan-hanh-nguyen-bao-doanh-thu-tang-20-moi-thang-lai-15-ty-127938.html"
    );
    const html = response.data;
    const $ = cheerio.load(html);

    const content = [];

    // Scrape content from c-detail-head div
    const detailHead = $(".l-main .c-detail-head").text().trim();

    // Scrape content from c-news-detail div
    const newsDetail = $(".l-main .c-news-detail").text().trim();

    // Split the detailHead content into lines
    const lines = detailHead.split("\n").filter((line) => line.trim() !== "");

    // Extract title from the first non-empty line
    const title = lines[lines.length - 3].trim();

    // Extract time and author from the second non-empty line
    const [time, author] = lines[lines.length - 2]
      .split("|")
      .map((item) => item.trim());

    // Extract URL from the last non-empty line
    const url = lines[lines.length - 1].trim();

    let extractedContent = newsDetail.split("\n").filter((line) => {
      return (
        line.trim() !== "" &&
        !line?.includes("document.get") &&
        !line?.includes("c-article") &&
        !line?.includes("padding") &&
        !line?.includes("margin")
      );
    });

    let indexOfSourceLink = extractedContent.findIndex((line) =>
      line.includes("Link bài")
    );
    console.log("indexOfSourceLink: ", indexOfSourceLink);

    let sourceLink = extractedContent[indexOfSourceLink]
      ?.trim()
      ?.replace("Link bài gốc", "");
    let authorDetail = extractedContent[indexOfSourceLink - 1]?.trim();
    //merge all the content before the source link
    extractedContent = extractedContent
      .slice(1, indexOfSourceLink - 1)
      .join("\n");

    console.log("Title:", title);
    console.log("Time:", time);
    console.log("Author:", author);
    console.log("URL:", url);
    // Push content to an object
    const contentObj = {
      detailHead: {
        title,
        time,
        author,
        url,
      },
      newsDetail: {
        extractedContent: extractedContent.trim(),
        sourceLink,
        authorDetail,
      },
    };

    // Push the object to the array
    content.push(contentObj);

    return content;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Usage
scrapeContent().then((content) => {
  console.log("Content:", content);
});
