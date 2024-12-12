const query = require("./common/query");

(async () => {
  let queryCommand = "SELECT * FROM can_doi_ke_toan WHERE organCode = 'VIC'";
  let result = await query(queryCommand);
  let queryInfo = "SELECT * FROM info_company WHERE symbol = 'VIC'";
  let resultQuery = await query(queryInfo);
  let currentInfo = resultQuery[0];
  let superSector = currentInfo.superSector;
  console.log("superSector: ", superSector);

  let dataMapCanDoiKeToan = [];
  let dataMapKetQuaKinhDoanh = [];
  let dataMapLuuChuyenTienTe = [];

  if (superSector === "Bảo hiểm") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          tienVaTuongDuongTien: item.bsa2,
          dauTuNganHan: item.bsa5,
          dauTuDaiHan: item.bsa43,
          cacKhoanPhaiThu: item.bsa8,
          hangTonKhoRong: item.bsa15,
          taiSanNganHanKhac: item.bsa18,
          taiSanTaiBaoHiem: item.bsi192,
          phaiThuDaiHan: item.bsa24,
          taiSanCoDinh: item.bsa29,
          batDongSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          cacKhoanDauTuTaiChinhDaiHan: item.bsa43,
          taiSanDaiHanKhac: item.bsa49,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonChuSoHuu: item.bsa78,
        },
      };
    });
  }

  if (superSector === "Ngân hàng") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          tienMatVangBacDaQuy: item.bsa2,
          tienGuiTaiNganHangNhaNuocVietNam: item.bsb97,
          tienGuiTaiCacTCTDKhacVaChoVayCacTCTDKhac: item.bsb98,
          chungKhoanKinhDoanh: item.bsb99,
          cacCongCuTaiChinhPhaiSinhVaCacTaiSanTaiChinhKhac: item.bsb102,
          choVayKhachHang: item.bsb103,
          chungKhoanDauTu: item.bsb106,
          gopVonDauTuDaiHan: item.bsa43,
          taiSanCoDinh: item.bsa29,
          giaTriRongTaiSanDauTu: item.bsa40,
          taiSanCoKhac: item.bsb110,
        },
        nguonVon: {
          cacKhoanNoChinhPhuVaNHNNVietNam: item.bsb111,
          tienGuiVaVayCacToChucTinDungKhac: item.bsb112,
          tienGuiCuaKhacHang: item.bsb113,
          cacCongCuTaiChinhPhaiSinhVaCacKhoanNoTaiChinhKhac: item.bsb114,
          vonTaiTroUyThacDauTuCuaChinhPhuVaCacToChucTinDungKhac: item.bsb115,
          phatHanhGiayToCoGia: item.bsb116,
          cacKhoanNoKhac: item.bsb117,
          vonCuaToChucTinDung: item.bsb118,
          quyCuaToChucTinDung: item.bsb121,
          chenhLechTiGiaHoiDoai: item.bsa85,
          loiNhuanChuaPhanPhoi: item.bsa90,
        },
      };
    });
  }

  if (superSector === "Dịch vụ tài chính") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          taiSanTaiChinhNganHan: item.bss214,
          taiSanLuuDongKhac: item.bsa18,
          taiSanTaiChinhDaiHan: item.bsa43,
          taiSanCoDinh: item.bsa29,
          giaTriRongBatDongSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          taiSanDaiHanKhac: item.bsa49,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonVaCacQuy: item.bsa78,
          loiIchCuaCoDongThieuSo: item.bsa95,
        },
      };
    });
  }

  if (superSector === "Bất động sản") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          tienVaTuongDuongTIen: item.bsa2,
          giaTriThuanDauTuNganHan: item.bsa5,
          dauTuDaiHan: item.bsa43,
          cacKhoanPhaiThu: item.bsa8,
          hangTonKhoRong: item.bsa15,
          taiSanLuuDongKhac: item.bsa18,
          phaiThuDaiHan: item.bsa24,
          taiSanCoDinh: item.bsa29,
          giaTriRongTaiSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          dauTuDaiHan: item.bsa43,
          taiSanDaiHanKhac: item.bsa49,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonVaCacQuy: item.bsa78,
          loiIchCuaCoDongThieuSo: item.bsa95,
        },
      };
    });
  }

  //   //bao hiem
  //   let dataMapBaoHiem = result.map((item) => {
  //     return {
  //       ...item,
  //       taiSan: {
  //         tienVaTuongDuongTIen: item.bsa2,
  //         dauTuNganHan: item.bsa5,
  //         dauTuDaiHan: item.bsa43,
  //         cacKhoanPhaiThu: item.bsa8,
  //         hangTonKhoRong: item.bsa15,
  //         taiSanNganHanKhac: item.bsa18,
  //         taiSanTaiBaoHiem: item.bsi192,
  //         phaiThuDaiHan: item.bsa24,
  //         taiSanCoDinh: item.bsa29,
  //         batDongSanDauTu: item.bsa40,
  //         taiSanDoDangDaiHan: item.bsa163,
  //         cacKhoanDauTuTaiChinhDaiHan: item.bsa43,
  //         taiSanDaiHanKhac: item.bsa49,
  //       },
  //       nguonVon: {
  //         noNganHan: item.bsa55,
  //         noDaiHan: item.bsa67,
  //         vonChuSoHuu: item.bsa78,
  //       },
  //     };
  //   });

  //   //nganHang
  //   let dataMapNganHang = result.map((item) => {
  //     return {
  //       ...item,
  //       taiSan: {
  //         tienMatVangBacDaQuy: item.bsa2,
  //         tienGuiTaiNganHangNhaNuocVietNam: item.bsb97,
  //         tienGuiTaiCacTCTDKhacVaChoVayCacTCTDKhac: item.bsb98,
  //         chungKhoanKinhDoanh: item.bsb99,
  //         cacCongCuTaiChinhPhaiSinhVaCacTaiSanTaiChinhKhac: item.bsb102,
  //         choVayKhachHang: item.bsb103,
  //         chungKhoanDauTu: item.bsb106,
  //         gopVonDauTuDaiHan: item.bsa43,
  //         taiSanCoDinh: item.bsa29,
  //         giaTriRongTaiSanDauTu: item.bsa40,
  //         taiSanCoKhac: item.bsb110,
  //       },
  //       nguonVon: {
  //         cacKhoanNoChinhPhuVaNHNNVietNam: item.bsb111,
  //         tienGuiVaVayCacToChucTinDungKhac: item.bsb112,
  //         tienGuiCuaKhacHang: item.bsb113,
  //         cacCongCuTaiChinhPhaiSinhVaCacKhoanNoTaiChinhKhac: item.bsb114,
  //         vonTaiTroUyThacDauTuCuaChinhPhuVaCacToChucTinDungKhac: item.bsb115,
  //         phatHanhGiayToCoGia: item.bsb116,
  //         cacKhoanNoKhac: item.bsb117,
  //         vonCuaToChucTinDung: item.bsb118,
  //         quyCuaToChucTinDung: item.bsb121,
  //         chenhLechTiGiaHoiDoai: item.bsa85,
  //         loiNhuanChuaPhanPhoi: item.bsa90,
  //       },
  //     };
  //   });

  //   //Dịch vụ tài chính (chứng khoán)
  //   let dataMapChungKhoan = result.map((item) => {
  //     return {
  //       ...item,
  //       taiSan: {
  //         taiSanTaiChinhNganHan: item.bss214,
  //         taiSanLuuDongKhac: item.bsa18,
  //         taiSanTaiChinhDaiHan: item.bsa43,
  //         taiSanCoDinh: item.bsa29,
  //         giaTriRongBatDongSanDauTu: item.bsa40,
  //         taiSanDoDangDaiHan: item.bsa163,
  //         taiSanDaiHanKhac: item.bsa49,
  //       },
  //       nguonVon: {
  //         noNganHan: item.bsa55,
  //         noDaiHan: item.bsa67,
  //         vonVaCacQuy: item.bsa78,
  //         loiIchCuaCoDongThieuSo: item.bsa95,
  //       },
  //     };
  //   });

  //   //Bất động sản
  //   let dataMapBatDongSan = result.map((item) => {
  //     return {
  //       ...item,
  //       taiSan: {
  //         tienVaTuongDuongTIen: item.bsa2,
  //         giaTriThuanDauTuNganHan: item.bsa5,
  //         dauTuDaiHan: item.bsa43,
  //         cacKhoanPhaiThu: item.bsa8,
  //         hangTonKhoRong: item.bsa15,
  //         taiSanLuuDongKhac: item.bsa18,
  //         phaiThuDaiHan: item.bsa24,
  //         taiSanCoDinh: item.bsa29,
  //         giaTriRongTaiSanDauTu: item.bsa40,
  //         taiSanDoDangDaiHan: item.bsa163,
  //         dauTuDaiHan: item.bsa43,
  //         taiSanDaiHanKhac: item.bsa49,
  //       },
  //       nguonVon: {
  //         noNganHan: item.bsa55,
  //         noDaiHan: item.bsa67,
  //         vonVaCacQuy: item.bsa78,
  //         loiIchCuaCoDongThieuSo: item.bsa95,
  //       },
  //     };
  //   });

  queryCommand = "SELECT * FROM luu_chuyen_tien_te WHERE organCode = 'VIC'";
  result = await query(queryCommand);
  dataMapLuuChuyenTienTe = result.map((item, index) => {
    return {
      ...item,
      luuChuyenTien: {
        LCTTTuHoatDongDauTu: item.cfa26,
        LCTTTuaHoatDongTaiChinh: item.cfa34,
        LCTTTuHoatDongKinhDoanh: item.cfa18,
        tienVaTuongDuongCuoiKi: item.cfa38,
      },
    };
  });

  queryCommand = "SELECT * FROM ket_qua_kinh_doanh WHERE organCode = 'VIC'";
  result = await query(queryCommand);
  dataMapKetQuaKinhDoanh = result.map((item, index) => {
    let doanhThuThuanYoy = 0;
    let loiNhuanTruocThueYoy = 0;

    let gap = item.quarterReport !== 5 ? 4 : 1;
    if (
      index + gap <= result.length - 1 &&
      result[index + gap]?.quarterReport === item.quarterReport &&
      result[index + gap]?.yearReport === item.yearReport - 1
    ) {
      let doanhThuThuanCurrent = result[index].isa3;
      let doanhThuThuanLastYear = result[index + gap].isa3;
      doanhThuThuanYoy =
        ((doanhThuThuanCurrent - doanhThuThuanLastYear) /
          doanhThuThuanLastYear) *
        100;
      //lam tron 2 chu so thap phan
      doanhThuThuanYoy = Math.round(doanhThuThuanYoy * 100) / 100;

      let loiNhuanTruocThueCurrent = result[index].isa16;
      let loiNhuanTruocThueLastYear = result[index + gap].isa16;
      loiNhuanTruocThueYoy =
        ((loiNhuanTruocThueCurrent - loiNhuanTruocThueLastYear) /
          loiNhuanTruocThueLastYear) *
        100;
      //lam tron 2 chu so thap phan
      loiNhuanTruocThueYoy = Math.round(loiNhuanTruocThueYoy * 100) / 100;

      let loiNhuanSauThueCurrent = result[index].isa20;
      let loiNhuanSauThueLastYear = result[index + gap].isa20;
      loiNhuanSauThueYoy =
        ((loiNhuanSauThueCurrent - loiNhuanSauThueLastYear) /
          loiNhuanSauThueLastYear) *
        100;
      //lam tron 2 chu so thap phan
      loiNhuanSauThueYoy = Math.round(loiNhuanSauThueYoy * 100) / 100;
    }
    return {
      ...item,
      doanhThuThuan: {
        doanhThuThuan: item.isa3,
        doanhThuThuanYoY: doanhThuThuanYoy,
      },
      coCauLoiNhuanTruocThue: {
        loiNhuanKhac: item.isa14,
        laiLoTuCongTyLDLK: item.isa102,
        loiNhuanTaiChinh: item.isa15,
        loiNhuanThuanTuHDKDChinh: item.ebit,
        loiNhuanTruocThueYOY: loiNhuanTruocThueYoy,
      },
      loiNhuanSauThue: {
        loiNhuanSauThue: item.isa20,
        loiNhuanSauThueYOY: loiNhuanSauThueYoy,
      },
    };
  });

  let dataQuarter = result.filter((item) => item.quarterReport !== 5);
  console.log("dataQuarter: ", dataQuarter);
  let dataYear = result.filter((item) => item.quarterReport === 5);
  console.log("dataYear: ", dataYear.length);
  //   console.log("result: ", result);
})();
