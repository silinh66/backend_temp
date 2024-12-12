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

const curMonthNumber = 5;
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

const crawlFDI = async () => {
  const listTitle = [
    "Vốn thực hiện",
    "Vốn đăng ký*",
    "Đăng ký cấp mới",
    "Đăng ký tăng thêm",
    "Góp vốn, mua cổ phần",
    "Cấp mới",
    "Tăng vốn",
    "Góp vốn, mua cổ phần",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelFDIName}`);
  const workbook2 = XLSX.readFile(`./file_data/${fileExcelFDINamePrev}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes(`thang ${curMonthNumber}`);
  });
  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingPrevCPI = workbook2.SheetNames.filter((name) => {
    return name.includes(`thang ${prevMonthNumber}`);
  });

  // Lưu trữ dữ liệu đọc được
  let data = [];
  let dataPrev = [];

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
        return row[1]?.trim()?.includes(item?.trim());
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound && row[4]) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          value: row[4],
        });
      }
    });
  });
  sheetNamesContainingPrevCPI.forEach((sheetName) => {
    const worksheet = workbook2.Sheets[sheetName];
    // Chuyển đổi worksheet thành JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
    });

    // Duyệt qua mỗi dòng dữ liệu
    jsonData.forEach((row, index) => {
      // console.log("row: ", row);
      let titleFound = listTitle?.find((item) => {
        return row[1]?.trim()?.includes(item?.trim());
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound && !!row[4]) {
        // Thêm dữ liệu vào mảng data
        dataPrev.push({
          title: titleFound,
          value: row[4],
        });
      }
    });
  });

  console.log(data);
  console.log(dataPrev);

  let dataCurrentMap = data?.map((item) => {
    return item?.value;
  });
  let dataPrevMap = dataPrev?.map((item) => {
    return item?.value;
  });
  console.log("dataPrevMap: ", dataPrevMap);
  console.log("dataCurrentMap: ", dataCurrentMap);

  let dataFinalMap = dataCurrentMap?.map((item, index) => {
    return item - dataPrevMap[index];
  });
  console.log("dataFinalMap: ", dataFinalMap);
  //add new month
  await query(
    `INSERT INTO fdi
            (von_thuc_hien_fdi,
              von_dang_ky_fdi,
              dang_ky_cap_moi_fdi,
              dang_ky_tang_them_fdi,
              gop_von_mua_co_phan_fdi,
              so_du_an_cap_moi_fdi,
              so_du_an_tang_von_fdi,
              so_du_an_gop_von_mua_co_phan_fdi,
             time) VALUES (?)
        `,
    curMonthNumber === 1
      ? [[...dataCurrentMap, listMonthMap[curMonthNumber - 1]]]
      : [[...dataFinalMap, listMonthMap[curMonthNumber - 1]]]
  );
};

crawlFDI();
