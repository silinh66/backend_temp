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

const crawlGDPHienHanh = async () => {
  const listTitle = [
    "TỔNG SỐ",
    "Nông, lâm nghiệp và thủy sản",
    "Nông nghiệp",
    "Lâm nghiệp",
    "Thủy sản",
    "Bộ Công thương",
    "Công nghiệp và xây dựng",
    "Công nghiệp",
    "Khai khoáng",
    "Công nghiệp chế biến, chế tạo",
    `Sản xuất và phân phối điện`,
    `Cung cấp nước`,
    "Xây dựng",
    "Dịch vụ",
    `Bán buôn và bán lẻ; sửa chữa ô tô`,
    "Vận tải, kho bãi",
    "Dịch vụ lưu trú và ăn uống",
    "Thông tin và truyền thông",
    "Hoạt động tài chính, ngân hàng và bảo hiểm",
    "Hoạt động kinh doanh bất động sản",
    "Hoạt động chuyên môn, khoa học và công nghệ",
    "Hoạt động hành chính và dịch vụ hỗ trợ",
    `Hoạt động của Đảng Cộng sản, tổ chức`,
    "Giáo dục và đào tạo",
    "Y tế và hoạt động trợ giúp xã hội",
    "Nghệ thuật, vui chơi và giải trí",
    "Hoạt động dịch vụ khác",
    `Hoạt động làm thuê các công việc`,
    "Thuế sản phẩm trừ trợ cấp sản phẩm",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes("GDP HH") || name.includes("GDP-HH");
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
        if (row[1]?.trim() === "Công nghiệp chế biến, chế tạo") {
          if (
            listTitle?.includes("Công nghiệp chế biến, chế tạo") &&
            item?.trim() === "Công nghiệp chế biến, chế tạo"
          ) {
            return true;
          }
        } else if (row[1]?.trim() === "Dịch vụ lưu trú và ăn uống") {
          if (
            listTitle?.includes("Dịch vụ lưu trú và ăn uống") &&
            item?.trim() === "Dịch vụ lưu trú và ăn uống"
          ) {
            return true;
          }
        } else {
          return (
            row[0]?.trim()?.includes(item?.trim()) ||
            row[1]?.trim()?.includes(item?.trim())
          );
        }
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          quy_truoc: row[3],
          quy_nay: row[3],
        });
      }
    });
  });

  console.log(data);

  let dataQuyTruoc = data?.map((item) => {
    return item?.quy_truoc;
  });
  let dataQuyNay = data?.map((item) => {
    return item?.quy_nay;
  });

  //update quy truoc
  // await query(
  //   `UPDATE gdp_danh_nghia set
  //       gdp_theo_gia_hien_hanh = ?,
  //       gdp_hh_nong_nghiep_lam_nghiep_va_thuy_san = ?,
  //       gdp_hh_nong_nghiep = ?,
  //       gdp_hh_lam_nghiep = ?,
  //       gdp_hh_thuy_san = ?,
  //       gdp_hh_cong_nghiep_va_xay_dung = ?,
  //       gdp_hh_cong_nghiep = ?,
  //       gdp_hh_khai_khoang = ?,
  //       gdp_hh_cong_nghiep_che_bien_che_tao = ?,
  //       gdp_hh_san_xuat_va_phan_phoi_dien = ?,
  //       gdp_hh_cung_cap_nuoc_va_xu_ly_nuoc_thai = ?,
  //       gdp_hh_xay_dung = ?,
  //       gdp_hh_dich_vu = ?,
  //       gdp_hh_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may = ?,
  //       gdp_hh_van_tai_kho_bai = ?,
  //       gdp_hh_dich_vu_luu_tru_va_an_uong = ?,
  //       gdp_hh_thong_tin_va_truyen_thong = ?,
  //       gdp_hh_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem = ?,
  //       gdp_hh_hoat_dong_kinh_doanh_bat_dong_san = ?,
  //       gdp_hh_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe = ?,
  //       gdp_hh_hoat_dong_hanh_chinh_va_dich_vu_ho_tro = ?,
  //       gdp_hh_hoat_dong_cua_cac_to_chuc_chinh_tri = ?,
  //       gdp_hh_giao_duc_va_dao_tao = ?,
  //       gdp_hh_y_te_va_hoat_dong_cuu_tro_xa_hoi = ?,
  //       gdp_hh_nghe_thuat_vui_choi_va_giai_tri = ?,
  //       gdp_hh_hoat_dong_dich_vu_khac = ?,
  //       gdp_hh_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh = ?,
  //       gdp_hh_thue_san_pham_tru_tro_cap_san_pham = ?
  //       WHERE time = ?
  //   `,
  //   [...dataQuyTruoc, listMonthMap[curMonthNumber - 1]]
  // );
  //add new quarter
  await query(
    `INSERT INTO gdp_danh_nghia  
        (gdp_theo_gia_hien_hanh,
        gdp_hh_nong_nghiep_lam_nghiep_va_thuy_san,
        gdp_hh_nong_nghiep,
        gdp_hh_lam_nghiep,
        gdp_hh_thuy_san,
        gdp_hh_cong_nghiep_va_xay_dung,
        gdp_hh_cong_nghiep,
        gdp_hh_khai_khoang,
        gdp_hh_cong_nghiep_che_bien_che_tao,
        gdp_hh_san_xuat_va_phan_phoi_dien,
        gdp_hh_cung_cap_nuoc_va_xu_ly_nuoc_thai,
        gdp_hh_xay_dung,
        gdp_hh_dich_vu,
        gdp_hh_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may,
        gdp_hh_van_tai_kho_bai,
        gdp_hh_dich_vu_luu_tru_va_an_uong,
        gdp_hh_thong_tin_va_truyen_thong,
        gdp_hh_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem,
        gdp_hh_hoat_dong_kinh_doanh_bat_dong_san,
        gdp_hh_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe,
        gdp_hh_hoat_dong_hanh_chinh_va_dich_vu_ho_tro,
        gdp_hh_hoat_dong_cua_cac_to_chuc_chinh_tri,
        gdp_hh_giao_duc_va_dao_tao,
        gdp_hh_y_te_va_hoat_dong_cuu_tro_xa_hoi,
        gdp_hh_nghe_thuat_vui_choi_va_giai_tri,
        gdp_hh_hoat_dong_dich_vu_khac,
        gdp_hh_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh,
        gdp_hh_thue_san_pham_tru_tro_cap_san_pham, time) VALUES (?)
    `,
    [[...dataQuyNay, listMonthMap[curMonthNumber - 1]]]
  );

  //   //insert new data
  //   await query(
  //     "INSERT INTO cpi (time, CPI, CPI_hang_an_va_dich_vu_an_uong, CPI_luong_thuc, CPI_thuc_pham, CPI_an_uong_ngoai_gia_dinh, CPI_do_uong_va_thuoc_la, CPI_may_mac_mu_non_giay_dep, CPI_nha_o_va_vat_lieu_xay_dung, CPI_thiet_bi_va_do_dung_gia_dinh, CPI_thuoc_va_dich_vu_y_te, CPI_dich_vu_y_te, CPI_giao_thong, CPI_buu_chinh_vien_thong, CPI_giao_duc, CPI_dich_vu_giao_duc, CPI_hang_hoa_va_dich_vu_khac, CPI_van_hoa_giai_tri_va_du_lich) VALUES (?)",
  //     [
  //       [
  //         timeMonth,
  //         data[0]?.CPI,
  //         data[1]?.CPI,
  //         data[2]?.CPI,
  //         data[3]?.CPI,
  //         data[4]?.CPI,
  //         data[5]?.CPI,
  //         data[6]?.CPI,
  //         data[7]?.CPI,
  //         data[8]?.CPI,
  //         data[9]?.CPI,
  //         data[10]?.CPI,
  //         data[11]?.CPI,
  //         data[12]?.CPI,
  //         data[13]?.CPI,
  //         data[14]?.CPI,
  //         data[15]?.CPI,
  //         data[16]?.CPI,
  //       ],
  //     ]
  //   );
};

const crawlGDPThuc = async () => {
  const listTitle = [
    "TỔNG SỐ",
    "Nông, lâm nghiệp và thủy sản",
    "Nông nghiệp",
    "Lâm nghiệp",
    "Thủy sản",
    "Công nghiệp và xây dựng",
    "Công nghiệp",
    "Khai khoáng",
    "Công nghiệp chế biến, chế tạo",
    `Sản xuất và phân phối điện`,
    `Cung cấp nước`,
    "Xây dựng",
    "Dịch vụ",
    `Bán buôn và bán lẻ; sửa chữa ô tô`,
    "Vận tải, kho bãi",
    "Dịch vụ lưu trú và ăn uống",
    "Thông tin và truyền thông",
    "Hoạt động tài chính, ngân hàng và bảo hiểm",
    "Hoạt động kinh doanh bất động sản",
    "Hoạt động chuyên môn",
    "Hoạt động hành chính và dịch vụ hỗ trợ",
    `Hoạt động của Đảng Cộng sản, tổ chức`,
    "Giáo dục và đào tạo",
    "Y tế và hoạt động trợ giúp xã hội",
    "Nghệ thuật, vui chơi và giải trí",
    "Hoạt động dịch vụ khác",
    `Hoạt động làm thuê các công việc`,
    "Thuế sản phẩm trừ trợ cấp sản phẩm",
  ];

  // Đường dẫn đến file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Tìm tất cả sheet có chứa chữ "CPI"
  const sheetNamesContainingCPI = workbook.SheetNames.filter((name) => {
    return name.includes("GDP SS") || name.includes("GDP-SS");
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
        if (row[1]?.trim() === "Công nghiệp chế biến, chế tạo") {
          if (
            listTitle?.includes("Công nghiệp chế biến, chế tạo") &&
            item?.trim() === "Công nghiệp chế biến, chế tạo"
          ) {
            return true;
          }
        } else if (row[1]?.trim() === "Dịch vụ lưu trú và ăn uống") {
          if (
            listTitle?.includes("Dịch vụ lưu trú và ăn uống") &&
            item?.trim() === "Dịch vụ lưu trú và ăn uống"
          ) {
            return true;
          }
        } else {
          return (
            row[0]?.trim()?.includes(item?.trim()) ||
            row[1]?.trim()?.includes(item?.trim())
          );
        }
      });
      // Kiểm tra tiêu đề trong cột B (__EMPTY_1) hoặc cột C (__EMPTY_2) có trong listTitle không
      if (titleFound) {
        // Thêm dữ liệu vào mảng data
        data.push({
          title: titleFound,
          quy_truoc: row[3],
          quy_nay: row[3],
        });
      }
    });
  });

  console.log(data);

  let dataQuyTruoc = data?.map((item) => {
    return item?.quy_truoc;
  });
  let dataQuyNay = data?.map((item) => {
    return item?.quy_nay;
  });

  //update quy truoc
  await query(
    `UPDATE gdp_thuc set 
    gdp_so_sanh = ?,
    gdp_nong_nghiep_lam_nghiep_va_thuy_san = ?,
    gdp_nong_nghiep = ?,
    gdp_lam_nghiep = ?,
    gdp_thuy_san = ?,
    gdp_cong_nghiep_va_xay_dung = ?,
    gdp_cong_nghiep = ?,
    gdp_khai_khoang = ?,
    gdp_cong_nghiep_che_bien_che_tao = ?,
    gdp_san_xuat_va_phan_phoi_dien = ?,
    gdp_cung_cap_nuoc_va_xu_ly_nuoc_thai = ?,
    gdp_xay_dung = ?,
    gdp_dich_vu = ?,
    gdp_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may = ?,
    gdp_van_tai_kho_bai = ?,
    gdp_dich_vu_luu_tru_va_an_uong = ?,
    gdp_thong_tin_va_truyen_thong = ?,
    gdp_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem = ?,
    gdp_hoat_dong_kinh_doanh_bat_dong_san = ?,
    gdp_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe = ?,
    gdp_hoat_dong_hanh_chinh_va_dich_vu_ho_tro = ?,
    gdp_hoat_dong_cua_cac_to_chuc_chinh_tri = ?,
    gdp_giao_duc_va_dao_tao = ?,
    gdp_y_te_va_hoat_dong_cuu_tro_xa_hoi = ?,
    gdp_nghe_thuat_vui_choi_va_giai_tri = ?,
    gdp_hoat_dong_dich_vu_khac = ?,
    gdp_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh = ?,
    gdp_thue_san_pham_tru_tro_cap_san_pham = ? 
          WHERE time = ?
      `,
    [...dataQuyTruoc, listMonthMap[curMonthNumber - 1]]
  );
  //add new quarter
  await query(
    `INSERT INTO gdp_thuc  
          (gdp_so_sanh,
          gdp_nong_nghiep_lam_nghiep_va_thuy_san,
          gdp_nong_nghiep,
          gdp_lam_nghiep,
          gdp_thuy_san,
          gdp_cong_nghiep_va_xay_dung,
          gdp_cong_nghiep,
          gdp_khai_khoang,
          gdp_cong_nghiep_che_bien_che_tao,
          gdp_san_xuat_va_phan_phoi_dien,
          gdp_cung_cap_nuoc_va_xu_ly_nuoc_thai,
          gdp_xay_dung,
          gdp_dich_vu,
          gdp_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may,
          gdp_van_tai_kho_bai,
          gdp_dich_vu_luu_tru_va_an_uong,
          gdp_thong_tin_va_truyen_thong,
          gdp_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem,
          gdp_hoat_dong_kinh_doanh_bat_dong_san,
          gdp_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe,
          gdp_hoat_dong_hanh_chinh_va_dich_vu_ho_tro,
          gdp_hoat_dong_cua_cac_to_chuc_chinh_tri,
          gdp_giao_duc_va_dao_tao,
          gdp_y_te_va_hoat_dong_cuu_tro_xa_hoi,
          gdp_nghe_thuat_vui_choi_va_giai_tri,
          gdp_hoat_dong_dich_vu_khac,
          gdp_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh,
          gdp_thue_san_pham_tru_tro_cap_san_pham, time) VALUES (?)
      `,
    [[...dataQuyNay, listMonthMap[curMonthNumber - 1]]]
  );
};

// crawlGDPHienHanh();

crawlGDPThuc();
