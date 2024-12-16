const XLSX = require("xlsx");
const query = require("./common/query");

const convertMonthNumberToString = (month) => {
  if (month < 10) {
    return `0${month}`;
  } else {
    return `${month}`;
  }
};

const getPrevMonthString = (curMonth) => {
  if (curMonth === 1) {
    return `12`;
  }
  if (curMonth < 11) {
    return `0${curMonth - 1}`;
  }
  return `${curMonth - 1}`;
};

const getPrevMonthNumber = (curMonth) => {
  if (curMonth === 1) {
    return 12;
  }
  return curMonth - 1;
};

const curMonthNumber = 11;
const curYear = 2024;
const prevMonth = getPrevMonthString(curMonthNumber);
const prevMonthNumber = getPrevMonthNumber(curMonthNumber);
const curMonth = convertMonthNumberToString(curMonthNumber);
const fileExcelFDIName = `FDI_${curYear}-${curMonth}.xlsx`;
const fileExcelFDINamePrev = `FDI_${
  prevMonth === "12" ? curYear - 1 : curYear
}-${prevMonth}.xlsx`;
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

const crawlXuatKhau = async () => {
  const listTitle = [
    "TỔNG TRỊ GIÁ",
    "Khu vực kinh tế trong nước",
    "Khu vực có vốn đầu tư NN",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes("XK");
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
        return (
          row[0]?.trim()?.includes(item?.trim()) ||
          row[1]?.trim()?.includes(item?.trim())
        );
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          value: row[3],
        });
      }
    });
  });

  console.log(data);

  let dataXK = data?.map((item) => item?.value);

  //add new quarter
  await query(
    `INSERT INTO xuat_nhap_khau
            (XK_tong, XK_khu_vuc_trong_nuoc, XK_khu_vuc_trong_FDI, time) VALUES (?)
        `,
    [[...dataXK, listMonthMap[curMonthNumber - 1]]]
  );
};

const crawlNhapKhau = async () => {
  const listTitle = [
    "TỔNG TRỊ GIÁ",
    "Khu vực kinh tế trong nước",
    "Khu vực có vốn đầu tư NN",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes("NK");
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
        return (
          row[0]?.trim()?.includes(item?.trim()) ||
          row[1]?.trim()?.includes(item?.trim())
        );
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          value: row[3],
        });
      }
    });
  });

  console.log(data);

  let dataXK = data?.map((item) => item?.value);

  //add new quarter
  await query(
    `UPDATE xuat_nhap_khau set
              NK_tong = ?, NK_khu_vuc_trong_nuoc =?, NK_khu_vuc_trong_FDI =? WHERE time = ? 
          `,
    [...dataXK, listMonthMap[curMonthNumber - 1]]
  );
};

// crawlXuatKhau();

crawlNhapKhau();
