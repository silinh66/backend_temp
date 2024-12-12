const fs = require("fs");
const query = require("./common/query");

(async function () {
  let jsonObject = await fs.readFileSync("./dataBCTC.txt", "utf-8");
  jsonObject = JSON.parse(jsonObject);

  let dataResponse = jsonObject?.items;
  console.log("dataResponse: ", dataResponse);
  let dataQuy = dataResponse?.map((item) => item?.quarterly);
  if (!dataQuy) return;
  console.log("dataQuy[0]: ", dataQuy[0]);
  let dataQuyFilter = dataQuy[0]?.filter(
    (item) => item?.yearReport === 2024
    // && item?.quarterReport !== 5
  );
  console.log("dataQuyFilter: ", dataQuyFilter);
  if (!dataQuyFilter) return;
  let dataQuyMap = dataQuyFilter?.map((item) => {
    return ["TGP", ...Object.values(item)];
  });
  console.log("dataQuyMap", dataQuyMap);
  //   insert new data
  if (dataQuyMap?.length > 0)
    await query("INSERT INTO can_doi_ke_toan VALUES ?", [dataQuyMap]);
  // if (dataQuyMap?.length > 0)
  //   await query("INSERT INTO luu_chuyen_tien_te VALUES ?", [
  //     dataQuyMap,
  //   ]);
})();
