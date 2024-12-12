const XLSX = require("xlsx");
const fs = require("fs");

(async () => {
  for (let i = 1; i < 20; i++) {
    const workbook = await XLSX.readFile("Giá cổ phiếu Upcom.xlsx");
    // Specify the sheet that you want to convert to JSON
    const sheetName = workbook.SheetNames[i];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    jsonData.shift();
    jsonData = jsonData.map((item) => [...item]);

    const query = require("./common/query");

    await query(
      "INSERT INTO data_1D (date, symbol, open, high, low, close, volume) VALUES ?",
      [jsonData]
    );
    console.log(`done sheet ${i}`);
    //  // Save JSON to file
    // fs.writeFile(`output${i}.json`, JSON.stringify(jsonData, null, 2), (err) => {
    //   if (err) {
    //     console.error("Error while writing JSON to file: ", err);
    //   } else {
    //     console.log("JSON saved to output.json");
    //   }
    // });
  }
})();
