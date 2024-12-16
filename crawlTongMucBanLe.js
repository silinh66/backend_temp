const XLSX = require("xlsx");
const query = require("./common/query");

const curMonth = `11`;
const curYear = 2024;
const fileExcelName = `${curYear}-${curMonth}.xlsx`;
const listMonthMap = [
  `31/01/${curYear}`,
  `28/02/${curYear}`,
  `31/03/${curYear}`,
  `30/04/${curYear}`,
  `31/05/${curYear}`,
  `30/06/${curYear}`,
  `31/07/${curYear}`,
  `31/08/${curYear}`,
  `30/09/${curYear}`,
  `31/10/${curYear}`,
  `30/11/${curYear}`,
  `31/12/${curYear}`,
];

let timeMonth = listMonthMap[curMonth - 1];
console.log("timeMonth: ", timeMonth);

const crawlTongMucBanLe = async () => {
  const listTitle = [
    "TỔNG SỐ",
    "Bán lẻ hàng hóa",
    "Dịch vụ lưu trú, ăn uống",
    "Du lịch lữ hành",
    "Dịch vụ khác",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes("Tongmuc");
  });

  // Lưu trữ dữ liệu đọc được
  let data = [];

  sheetNamesContainingCPI.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    // Chuyển đổi worksheet thành JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
    });

    // Duyệt qua mỗi dòng dữ liệu
    jsonData.forEach((row, index) => {
      // console.log("row: ", row);
      let titleFound = listTitle?.find((item) => {
        return item.includes(row[0]?.trim());
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          data_goc: row[1],
          data_1: row[3],
          data_2: null,
          data_3: null,
          uocTinh: row[3],
        });
      }
    });
  });
  console.log("data: ", data);

  // console.log(data);

  //insert new data
  await query(
    "INSERT INTO tong_muc_ban_le_dich_vu (time, tong_ban_le_hh_va_dv, ban_le_dich_vu_luu_tru_an_uong, ban_le_hang_hoa, ban_le_du_lich_lu_hanh, ban_le_dich_vu_khac) VALUES (?)",
    [
      [
        timeMonth,
        data[0]?.uocTinh,
        data[1]?.uocTinh,
        data[2]?.uocTinh,
        data[3]?.uocTinh,
        data[4]?.uocTinh,
      ],
    ]
  );
};

crawlTongMucBanLe();
