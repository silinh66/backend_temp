let xlsx = require("xlsx");
const query = require("./common/query");

let workbook = xlsx.readFile("./data_xlsx/data.xlsx");

let sheet_name_list = workbook.SheetNames;

// console.log("sheet_name_list: ", sheet_name_list);

if (sheet_name_list.length === 0) return;

(async () => {
  for (let i = 0; i < sheet_name_list.length; i++) {
    const sheet = sheet_name_list[i];
    if (sheet === "Khối lượng sản xuất công nghiệp") {
      let xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
      // console.log("xlData: ", xlData);

      let dataNewsMap = xlData.map((item, index) => {
        if (index === 55) console.log("item: ", item);
        return [
          // item["``"] || null,
          item?.__EMPTY || null,
          item?.__EMPTY_1 || null,
          item?.__EMPTY_2 || null,
          item["Dữ liệu WiChart"] || null,
          item?.__EMPTY_3 || null,
          item?.__EMPTY_4 || null,
          item?.__EMPTY_5 || null,
          item?.__EMPTY_6 || null,
          item?.__EMPTY_7 || null,
          item?.__EMPTY_8 || null,
          item?.__EMPTY_9 || null,
          item?.__EMPTY_10 || null,
          item?.__EMPTY_11 || null,
          item?.__EMPTY_12 || null,
          item?.__EMPTY_13 || null,
          item?.__EMPTY_14 || null,
          item?.__EMPTY_15 || null,
          item?.__EMPTY_16 || null,
          item?.__EMPTY_17 || null,
          item?.__EMPTY_18 || null,
          item?.__EMPTY_19 || null,
          item?.__EMPTY_20 || null,
          item?.__EMPTY_21 || null,
          item?.__EMPTY_22 || null,
          item?.__EMPTY_23 || null,
          item?.__EMPTY_24 || null,
          item?.__EMPTY_25 || null,
          item?.__EMPTY_26 || null,
          item?.__EMPTY_27 || null,
          item?.__EMPTY_28 || null,
          item?.__EMPTY_29 || null,
          item?.__EMPTY_30 || null,
          item?.__EMPTY_31 || null,
          item?.__EMPTY_32 || null,
          item?.__EMPTY_33 || null,
          item?.__EMPTY_34 || null,
          item?.__EMPTY_35 || null,
          item?.__EMPTY_36 || null,
          item?.__EMPTY_37 || null,
          item?.__EMPTY_38 || null,
          item?.__EMPTY_39 || null,
          item?.__EMPTY_40 || null,
          item?.__EMPTY_41 || null,
          item?.__EMPTY_42 || null,
          item?.__EMPTY_43 || null,
          item?.__EMPTY_44 || null,
          item?.__EMPTY_45 || null,
          item?.__EMPTY_46 || null,
          item?.__EMPTY_47 || null,
          item?.__EMPTY_48 || null,
          item?.__EMPTY_49 || null,
          item?.__EMPTY_50 || null,
        ];
        // return [...Object.values(item)];
      });
      dataNewsMap = dataNewsMap.slice(3);
      console.log("header", dataNewsMap[0]);
      await query("INSERT INTO khoi_luong_san_xuat_cong_nghiep VALUES ?", [
        dataNewsMap,
      ]);
      // let header = xlData[0];
      // console.log("header: ", header);
      // let prevHeader = xlData[1];
      // console.log("prevHeader: ", prevHeader);
    }
  }
})();
