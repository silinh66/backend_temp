const moment = require("moment/moment");
const query = require("./common/query");
const handleDataTuDoanh = async () => {
  const XLSX = require("xlsx");

  // Đường dẫn tới file Excel của bạn
  const workbook = XLSX.readFile(
    "./file_data/20241220_20241220 - Thong ke Giao Dich Tu doanh.xlsx"
    // "./file_data/20240301_20240301 - Thong ke Giao Dich Tu doanh.xlsx"
  );
  const sheetName = "Table 1"; // Tên của sheet bạn muốn đọc

  // Đọc dữ liệu từ sheet
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Loại bỏ hàng đầu tiên nếu nó chứa tiêu đề cột
  data.shift();

  // Khởi tạo mảng để chứa dữ liệu
  const dataArray = [];

  // Định dạng ngày tháng từ tên file hoặc từ dữ liệu nếu có sẵn
  const date_time = moment().format("YYYY-MM-DD HH:mm:ss");

  // Chuyển đổi dữ liệu sang định dạng mong muốn
  data.forEach((row, index) => {
    if (row && row.length > 0) {
      // Bỏ qua hàng không chứa mã CK hoặc hàng tổng cộng
      if (index === 5) {
        const totalItem = {
          ma_ck: "all",
          buy_vol: row[3],
          sell_vol: row[2],
          buy_val: row[5],
          sell_val: row[4],
          date_time,
        };
        dataArray.push(totalItem);
      } else {
        const item = {
          ma_ck: row[1],
          buy_vol: row[3],
          sell_vol: row[2],
          buy_val: row[5],
          sell_val: row[4],
          date_time,
        };
        dataArray.push(item);
      }
    }
  });

  // console.log(dataArray);

  let dataMap = dataArray?.map((item) => {
    return [...Object.values(item)];
  });
  console.log("dataMap: ", dataMap);

  //insert new data
  await query("INSERT INTO tu_doanh VALUES ?", [dataMap]);

  // Nếu cần, lưu dữ liệu vào file JSON
  // const fs = require('fs');
  // fs.writeFileSync('data.json', JSON.stringify(dataArray, null, 2));
};

handleDataTuDoanh();
