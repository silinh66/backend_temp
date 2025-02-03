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

const curMonthNumber = 12;
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

const crawlDauTuNganSachNhaNuoc = async () => {
  const listTitle = [
    "TỔNG SỐ",
    "Trung ương",
    "Bộ Giao thông vận tải",
    "Bộ NN và PTNT",
    "Bộ Tài nguyên và Môi trường",
    "Bộ Giáo dục và Đào tạo",
    "Bộ Giáo dục - Đào tạo",
    "Bộ Văn hóa, Thể thao và Du lịch",
    "Bộ Y tế",
    "Bộ Công Thương",
    "Bộ Xây dựng",
    "Bộ Thông tin và Truyền thông",
    "Bộ Khoa học và Công nghệ",
    "Vốn ngân sách NN cấp tỉnh",
    "Vốn ngân sách NN cấp huyện",
    "Vốn ngân sách NN cấp xã",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return (
      (name.includes("VĐT NSNN") ||
        name.includes("VNSNN tháng") ||
        name.includes("VDT") ||
        (curMonthNumber !== 12 && name.includes("VĐT"))) &&
      !name.includes("VDT TTNSNN quy") &&
      !name.includes("VĐT TXH") &&
      !name.includes("VĐT NSNN quy")
    );
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
      //   console.log("row: ", row);
      let titleFound = listTitle?.find((item) => {
        return (
          row[0]?.trim()?.toLowerCase()?.includes(item?.trim().toLowerCase()) ||
          row[1]?.trim()?.toLowerCase().includes(item?.trim().toLowerCase())
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

  //add new month
  await query(
    `INSERT INTO von_dau_tu_ngan_sach_nha_nuoc (
          von_nsnn_tong,
          von_nsnn_trung_uong,
          von_nsnn_bo_giao_thong_van_tai,
          von_nsnn_bo_nn_va_ptnt,
          von_nsnn_bo_tai_nguyen_va_moi_truong,
          von_nsnn_bo_giao_duc_dao_tao,
          von_nsnn_bo_van_hoa_the_thao_va_du_lich,
          von_nsnn_bo_y_te,
          von_nsnn_bo_cong_thuong,
          von_nsnn_bo_xay_dung,
          von_nsnn_bo_thong_tin_va_truyen_thong,
          von_nsnn_bo_khoa_hoc_va_cong_nghe,
          von_nsnn_von_ngan_sach_nn_cap_tinh,
          von_nsnn_von_ngan_sach_nn_cap_huyen,
          von_nsnn_von_ngan_sach_nn_cap_xa,
          time
          ) VALUES (?)`,
    [[...dataXK, listMonthMap[curMonthNumber - 1]]]
  );
};

crawlDauTuNganSachNhaNuoc();
