const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

// Đường dẫn file JSON và thư mục lưu trữ
const jsonFilePath = path.join(__dirname, "hsx_id_symbol.json");
const baseDir = path.join(__dirname, "bctc_new");

// Đọc file JSON và trả về danh sách mã chứng khoán
async function getStockList() {
  const data = await fs.readJson(jsonFilePath);
  return data.rows.map((stock) => ({
    id: stock.id.split("_")[0],
    symbol: stock.cell[1].trim(),
  }));
}

// Hàm lấy và tải các báo cáo tài chính cho mỗi mã chứng khoán
async function fetchAndDownloadReports(stock) {
  console.log(`Bắt đầu xử lý cho mã: ${stock.symbol}`);
  const reportsUrl = `https://www.hsx.vn/Areas/Desktop/WebFinancialReport/GetByOwner/${stock.id}?objectType=1&languageId=10dd075f-c751-46d2-b598-022850e517f6&pageFieldName1=ReportOption&pageFieldValue1=&pageFieldOperator1=eq&pageFieldName2=Year1&pageFieldValue2=&pageFieldOperator2=eq&pageFieldName3=Quarter&pageFieldValue3=1&pageFieldOperator3=eq&pageFieldName4=Year2&pageFieldValue4=&pageFieldOperator4=eq&pageFieldName5=Month&pageFieldValue5=1&pageFieldOperator5=eq&pageFieldName6=Year3&pageFieldValue6=&pageFieldOperator6=eq&pageCriteriaLength=6&_search=false&nd=1723140297692&rows=250&page=1&sidx=id&sord=desc`;
  let response;
  try {
    response = await axios.get(reportsUrl);
  } catch (error) {
    console.error(
      `Lỗi khi lấy báo cáo cho mã ${stock.symbol}: ${error.message}`
    );
    return;
  }

  const reports = response.data.rows;
  //write reports to file, if not exist create new file
  const reportsPath = path.join(baseDir, `${stock.symbol}.json`);
  await fs.writeJson(reportsPath, reports);

  const stockDir = path.join(baseDir, stock.symbol);
  await fs.ensureDir(stockDir);

  for (let report of reports) {
    try {
      console.log(`Tải báo cáo: ${report.cell[3]}`);
      const reportUrl = `https://www.hsx.vn/Areas/Desktop/WebFinancialReport/Download?id=${report.id}`;
      const reportData = await axios.get(reportUrl, {
        responseType: "arraybuffer",
      });
      const reportPath = path.join(stockDir, `${report.cell[3]}.pdf`);
      await fs.writeFile(reportPath, reportData.data);
      console.log(`Tải thành công: ${report.cell[3]}`);
      await sleep(500); // Delay 1 giây
    } catch (error) {
      console.error(`Lỗi khi tải báo cáo ${report.cell[3]}: ${error.message}`);
      continue; // Bỏ qua và tiếp tục với báo cáo tiếp theo
    }
  }
}

// Chạy chương trình
async function main() {
  const stockList = await getStockList();
  for (let stock of stockList) {
    await fetchAndDownloadReports(stock);
  }
}

main().catch((err) => console.error(err));
