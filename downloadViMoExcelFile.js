const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer");

// Tạo agent HTTPS với cấu hình bỏ qua xác minh SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Bỏ qua xác minh SSL
});

// Tạo thư mục nếu nó không tồn tại
const directory = "./file_data";
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

const downloadFileExcel = async () => {
  (async () => {
    const browser = await puppeteer.launch({ headless: false }); // Launch in non-headless mode
    const page = await browser.newPage();
    await page.goto(
      "https://www.gso.gov.vn/bao-cao-tinh-hinh-kinh-te-xa-hoi-hang-thang/?paged=1",
      { waitUntil: "networkidle2" }
    );

    // Correctly select the links within the archive-container
    const reportLinks = await page.$$eval(
      ".archive-container > p > a",
      (links) => links.map((link) => link.href).filter((url) => url)
    );

    let excelUrls = [];

    for (let link of reportLinks) {
      if (!link) continue; // Skip if the link is empty
      console.log(`Visiting: ${link}`);
      await page.goto(link, { waitUntil: "networkidle2" });
      // Find the Excel file download URL
      const excelUrl = await page.$$eval('li a[href$=".xlsx"]', (links) =>
        links.map((a) => a.href)
      );
      excelUrls.push(...excelUrl);
    }

    for (let i = 0; i < excelUrls.length; i++) {
      const url = excelUrls[i];

      try {
        let response = await axios.get(url, {
          responseType: "arraybuffer",
          httpsAgent: httpsAgent, // Sử dụng agent HTTPS tùy chỉnh
        });

        const filePath = path.join(
          directory,
          `${url.split("uploads/")[1]?.replace(/\//g, "-").slice(0, 7)}.xlsx`
        );

        fs.writeFile(filePath, response.data, (err) => {
          if (err) {
            console.error("Có lỗi khi lưu tệp: ", err);
          } else {
            console.log(`Tệp đã được lưu thành công tại ${filePath}`);
          }
        });
      } catch (error) {
        console.error("Có lỗi khi tải xuống tệp: ", error);
      }
    }

    //   // Write the Excel URLs to a file
    //   const filePath = path.resolve(__dirname, "excelUrl.txt");
    //   fs.writeFileSync(filePath, excelUrls.join("\n"));

    //   console.log(`Excel URLs have been written to ${filePath}`);

    //   await browser.close();
  })();
};

downloadFileExcel();
