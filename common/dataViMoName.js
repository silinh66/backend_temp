const TITLES = {
  gdp_theo_gia_hien_hanh: "GDP theo giá hiện hành",
  gdp_hh_nong_nghiep_lam_nghiep_va_thuy_san:
    "GDP HH Nông nghiệp, lâm nghiệp và thủy sản",
  gdp_hh_nong_nghiep: "GDP HH Nông nghiệp",
  gdp_hh_lam_nghiep: "GDP HH Lâm nghiệp",
  gdp_hh_thuy_san: "GDP HH Thủy sản",
  gdp_hh_cong_nghiep_va_xay_dung: "GDP HH Công nghiệp và xây dựng",
  gdp_hh_cong_nghiep: "GDP HH Công nghiệp",
  gdp_hh_khai_khoang: "GDP HH Khai khoáng",
  gdp_hh_cong_nghiep_che_bien_che_tao: "GDP HH Công nghiệp chế biến, chế tạo",
  gdp_hh_san_xuat_va_phan_phoi_dien: "GDP HH Sản xuất và phân phối điện",
  gdp_hh_cung_cap_nuoc_va_xu_ly_nuoc_thai:
    "GDP HH Cung cấp nước và xử lý nước thải",
  gdp_hh_xay_dung: "GDP HH Xây dựng",
  gdp_hh_dich_vu: "GDP HH Dịch vụ",
  gdp_hh_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may:
    "GDP HH Bán buôn bán lẻ, sửa chữa ô tô, mô tô, xe máy",
  gdp_hh_van_tai_kho_bai: "GDP HH Vận tải kho bãi",
  gdp_hh_dich_vu_luu_tru_va_an_uong: "GDP HH Dịch vụ lưu trú và ăn uống",
  gdp_hh_thong_tin_va_truyen_thong: "GDP HH Thông tin và truyền thông",
  gdp_hh_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem:
    "GDP HH Hoạt động tài chính, ngân hàng và bảo hiểm",
  gdp_hh_hoat_dong_kinh_doanh_bat_dong_san:
    "GDP HH Hoạt động kinh doanh bất động sản",
  gdp_hh_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe:
    "GDP HH Hoạt động chuyên môn, khoa học và công nghệ",
  gdp_hh_hoat_dong_hanh_chinh_va_dich_vu_ho_tro:
    "GDP HH Hoạt động hành chính và dịch vụ hỗ trợ",
  gdp_hh_hoat_dong_cua_cac_to_chuc_chinh_tri:
    "GDP HH Hoạt động của các tổ chức chính trị",
  gdp_hh_giao_duc_va_dao_tao: "GDP HH Giáo dục đào tạo",
  gdp_hh_y_te_va_hoat_dong_cuu_tro_xa_hoi:
    "GDP HH Y tế và hoạt động cứu trợ xã hội",
  gdp_hh_nghe_thuat_vui_choi_va_giai_tri:
    "GDP HH Nghệ thuật, vui chơi và giải trí",
  gdp_hh_hoat_dong_dich_vu_khac: "GDP HH Hoạt động dịch vụ khác",
  gdp_hh_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh:
    "GDP HH Hoạt động làm thuê các công việc trong các hộ gia đình",
  gdp_hh_thue_san_pham_tru_tro_cap_san_pham:
    "GDP HH Thuế sản phẩm trừ trợ cấp sản phẩm",
};

const convertName = (key) => {
  return TITLES[key];
};
