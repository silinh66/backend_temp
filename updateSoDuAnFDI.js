const XLSX = require("xlsx");
const query = require("./common/query");

const workbook = XLSX.readFile(`./file_data/SoDuAnNew.xlsx`);
// Tìm tất cả sheet có chứa chữ "CPI"
const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
  return name.includes("Biểu đồ mới");
});
sheetNamesContainingCPI.forEach((sheetName) => {
  const worksheet = workbook.Sheets[sheetName];
  // Chuyển đổi worksheet thành JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
  });
  let data = [];
  // Duyệt qua mỗi dòng dữ liệu
  jsonData.forEach(async (row, index) => {
    console.log("row", row);
    data.push(row);

    //update
    await query(
      "UPDATE fdi set so_du_an_gop_von_mua_co_phan_fdi = ? where time = ?",
      [row[1], row[0]]
    );
  });
});
