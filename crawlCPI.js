const XLSX = require("xlsx");
const query = require("./common/query");

for (let j = 12; j < 13; j++) {
  const curMonth = j < 10 ? `0${j}` : j;
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

  const crawlCPI = async () => {
    const listTitle = [
      "CHỈ SỐ GIÁ TIÊU DÙNG",
      "Hàng ăn và dịch vụ ăn uống",
      "Lương thực",
      "Thực phẩm",
      "Ăn uống ngoài gia đình",
      "Đồ uống và thuốc lá",
      "May mặc, mũ nón và giày dép",
      "May mặc, giày dép và mũ nón",
      "Nhà ở và vật liệu xây dựng",
      "Thiết bị và đồ dùng gia đình",
      "Thuốc và dịch vụ y tế",
      "Dịch vụ y tế",
      "Giao thông",
      "Bưu chính viễn thông",
      "Giáo dục",
      "Dịch vụ giáo dục",
      "Văn hoá, giải trí và du lịch",
      "Hàng hóa và dịch vụ khác",
      "Đồ dùng và dịch vụ khác",
    ];

    // Đường dẫn đến file Excel
    const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

    // Tìm tất cả sheet có chứa chữ "CPI"
    const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
      return name.includes("CPI");
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
        let titleFound = listTitle?.find(
          (item) =>
            item.includes(row[0]?.trim()) || item.includes(row[1]?.trim())
        );
        // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
        if (titleFound) {
          // Thêm dữ liệu vào mảng data
          data.push({
            title: titleFound,
            data_goc: row[3],
            data_1: row[4],
            data_2: row[5],
            data_3: row[6],
            CPI: j === 12 ? row[6] : row[7],
          });
        }
      });
    });

    console.log(data);

    //insert new data
    await query(
      "INSERT INTO cpi (time, CPI, CPI_hang_an_va_dich_vu_an_uong, CPI_luong_thuc, CPI_thuc_pham, CPI_an_uong_ngoai_gia_dinh, CPI_do_uong_va_thuoc_la, CPI_may_mac_mu_non_giay_dep, CPI_nha_o_va_vat_lieu_xay_dung, CPI_thiet_bi_va_do_dung_gia_dinh, CPI_thuoc_va_dich_vu_y_te, CPI_dich_vu_y_te, CPI_giao_thong, CPI_buu_chinh_vien_thong, CPI_giao_duc, CPI_dich_vu_giao_duc, CPI_hang_hoa_va_dich_vu_khac, CPI_van_hoa_giai_tri_va_du_lich) VALUES (?)",
      [
        [
          timeMonth,
          data[0]?.CPI,
          data[1]?.CPI,
          data[2]?.CPI,
          data[3]?.CPI,
          data[4]?.CPI,
          data[5]?.CPI,
          data[6]?.CPI,
          data[7]?.CPI,
          data[8]?.CPI,
          data[9]?.CPI,
          data[10]?.CPI,
          data[11]?.CPI,
          data[12]?.CPI,
          data[13]?.CPI,
          data[14]?.CPI,
          data[15]?.CPI,
          data[16]?.CPI,
        ],
      ]
    );
  };

  crawlCPI();
}
