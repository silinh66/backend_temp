const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

(async () => {
  let response = await Axios.get("https://chogia.vn/gia-phan-bon-hom-nay");

  // Your HTML string
  const html = response?.data; // Replace `...` with your actual HTML content

  // Load the HTML string into cheerio
  const $ = cheerio.load(html);

  // Initialize an empty array to hold the result
  const result = [];

  // Temporary variable to hold the current stool name and its districts
  let currentStool = null;

  $("tr").each(function () {
    // Determine if the row is a stool name
    if ($(this).find("td").length === 1) {
      // If there's an existing stool, push it to the result array
      if (currentStool) {
        result.push(currentStool);
      }
      // Start a new stool object
      currentStool = {
        stoolName: $(this).text().trim(),
        list: [],
      };
    } else if ($(this).find("td").length === 4 && currentStool) {
      // Extract district and value, then add to the current stool's list
      const district = $(this).find("td").eq(0).text().trim();
      const value = $(this).find("td").eq(1).text().trim();
      currentStool.list.push({ district, value });
    }
  });

  // Don't forget to add the last stool to the result array if it exists
  if (currentStool) {
    result.push(currentStool);
  }

  // console.log(JSON.stringify(result, null, 2));

  let filterData = result?.filter((item, index) => {
    return (
      item?.list?.length > 0 &&
      item?.stoolName !== "MIỀN TRUNG" &&
      item?.stoolName !== "TÂY NAM BỘ" &&
      item?.stoolName !== "KHU VỰC MIỀN BẮC" &&
      item?.stoolName !== "KHU VỰC ĐÔNG NAM BỘ – TÂY NGUYÊN"
    );
  });
  // console.log("filterData: ", filterData);
  let listGiaPhanItem = filterData?.map((item, index) => {
    return [...item?.list];
  });
  listGiaPhanItem = [...listGiaPhanItem];
  console.log("listGiaPhanItem: ", listGiaPhanItem);
  let mapData = filterData?.map((item, index) => {
    let area = "";
    if (index < 5) {
      area = "Miền Trung";
    } else if (index < 10) {
      area = "Tây Nam Bộ";
    } else if (index < 16) {
      area = "Đông Nam Bộ - Tây Nguyên";
    } else {
      area = "Miền Bắc";
    }
    return {
      ...item,
      area,
    };
  });
  // console.log("mapData: ", mapData);
  let giaPhanData = mapData?.map((item, index) => {
    return {
      area: item?.area,
      stoolName: item?.stoolName,
      idStool: index,
    };
  });

  let dataPhanMap = giaPhanData.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM gia_phan");
  //insert new data
  await query("INSERT INTO gia_phan VALUES ?", [dataPhanMap]);
  // let dataMapOnline = filterDataOnline.map((item) => {
  //   return [...Object.values(item)];
  // });
  // //delete old data
  // await query("DELETE FROM lai_suat");
  // //insert new data
  // await query("INSERT INTO lai_suat VALUES ?", [dataMap]);

  // //delete old data
  // await query("DELETE FROM lai_suat_online");
  // //insert new data
  // await query("INSERT INTO lai_suat_online VALUES ?", [dataMapOnline]);
})();
