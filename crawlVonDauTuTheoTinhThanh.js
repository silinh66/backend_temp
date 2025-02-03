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

  function convertProvinceNameToUnsignCode(provinceName) {
    // Mapping Vietnamese characters to their unsign counterparts
    const charMap = {
      à: "a",
      á: "a",
      ả: "a",
      ã: "a",
      ạ: "a",
      ă: "a",
      ằ: "a",
      ắ: "a",
      ẳ: "a",
      ẵ: "a",
      ặ: "a",
      â: "a",
      ầ: "a",
      ấ: "a",
      ẩ: "a",
      ẫ: "a",
      ậ: "a",
      đ: "d",
      è: "e",
      é: "e",
      ẻ: "e",
      ẽ: "e",
      ẹ: "e",
      ê: "e",
      ề: "e",
      ế: "e",
      ể: "e",
      ễ: "e",
      ệ: "e",
      ì: "i",
      í: "i",
      ỉ: "i",
      ĩ: "i",
      ị: "i",
      ò: "o",
      ó: "o",
      ỏ: "o",
      õ: "o",
      ọ: "o",
      ô: "o",
      ồ: "o",
      ố: "o",
      ổ: "o",
      ỗ: "o",
      ộ: "o",
      ơ: "o",
      ờ: "o",
      ớ: "o",
      ở: "o",
      ỡ: "o",
      ợ: "o",
      ù: "u",
      ú: "u",
      ủ: "u",
      ũ: "u",
      ụ: "u",
      ư: "u",
      ừ: "u",
      ứ: "u",
      ử: "u",
      ữ: "u",
      ự: "u",
      ỳ: "y",
      ý: "y",
      ỷ: "y",
      ỹ: "y",
      ỵ: "y",
      // Add any other characters you need to replace
    };

    // Normalize, replace diacritics, and replace special characters and spaces
    let unsignCode = provinceName
      ?.toLowerCase()
      ?.split("")
      ?.map((char) => charMap[char] || char)
      ?.join("");
    unsignCode = unsignCode?.replace(/[\s.-]+/g, "_"); // Replace spaces, periods, and dashes with underscores

    return unsignCode;
  }

  let timeMonth = listMonthMap[curMonth - 1];

  const crawlCPI = async () => {
    const listTitle = [
      "Hà Nội",
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
      return (
        (name.includes("VDT tu NSNN") ||
          name.includes("VĐT NSNN") ||
          name.includes("VonDT") ||
          name.includes("VDT") ||
          name.includes("VĐT") ||
          name.includes("VĐT") ||
          name.includes("VNSNN tháng") ||
          name.includes("VNSNN tháng") ||
          name.includes("VonNSNNthang")) &&
        !name.includes("VĐTTXH") &&
        !name.includes("VDT TTXH") &&
        !name.includes("VDT TTNSNN quy") &&
        !name.includes("VĐT NSNN quy") &&
        !name.includes("VDT TXH") &&
        !name.includes("VĐT TXH") &&
        !name.includes("VonDTTXH")
      );
    });
    console.log("sheetNamesContainingCPI: ", sheetNamesContainingCPI);

    // Lưu trữ dữ liệu đọc được
    let data = [];

    sheetNamesContainingCPI.forEach(async (sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      // Chuyển đổi worksheet thành JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      });

      let jsonDataMap = jsonData
        ?.slice(j === 1 ? (j === 12 ? 27 : 23) : 24)
        .map((item, index) => {
          return {
            stt: index + 1,
            thanhPho: item[1],
            code: convertProvinceNameToUnsignCode(item[1]),
            vonDauTu: j === 1 || j === 12 ? item[3] : item[4],
            time: `${curYear}_${curMonth}`,
          };
        });
      let dataFinal = jsonDataMap.map((item) => {
        return [...Object.values(item)];
      });
      console.log("dataFinal: ", dataFinal);
      if (!dataFinal.length) {
        // no rows, skip or handle differently
        console.log("No rows to insert");
        return;
      }

      //delete old data
      await query(
        `DELETE FROM von_dau_tu WHERE time = '${curYear}_${curMonth}'`
      );

      //insert new data
      await query(
        "INSERT INTO von_dau_tu (stt, thanhPho, code, vonDauTu, time) VALUES ?",
        [dataFinal]
      );

      //done
      console.log("Done");
    });
  };

  crawlCPI();
}
