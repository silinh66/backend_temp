const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const query = require("./common/query");

const array = [
  {
    stoolName: "Phân urê ",
    list: [
      {
        district: "Phú Mỹ",
        value: "530.000 – 570.000",
      },
      {
        district: "Ninh Bình",
        value: "530.000 – 560.000",
      },
    ],
  },
  {
    stoolName: "Phân NPK 20 – 20 – 15",
    list: [
      {
        district: "Đầu Trâu",
        value: "970.000 – 1.000.000",
      },
      {
        district: "Song Gianh",
        value: "940.000 – 960.000",
      },
    ],
  },
  {
    stoolName: "Phân kali bột",
    list: [
      {
        district: "Phú Mỹ",
        value: "630.000 – 660.000",
      },
      {
        district: "Hà Anh",
        value: "630.000 – 660.000",
      },
    ],
  },
  {
    stoolName: "Phân NPK 16 – 16 – 8",
    list: [
      {
        district: "Đầu Trâu",
        value: "760.000 – 790.000",
      },
      {
        district: "Phú Mỹ",
        value: "750.000 – 780.000",
      },
      {
        district: "Lào Cai",
        value: "750.000 – 770.000",
      },
    ],
  },
  {
    stoolName: "Phân lân",
    list: [
      {
        district: "Lâm Thao",
        value: "260.000 – 280.000",
      },
      {
        district: "Văn Điển",
        value: "280.000 – 320.000",
      },
    ],
  },
];
(async () => {
  let response = await Axios.get("https://chogia.vn/lai-suat/");
  console.log("response: ", response);

  // Your HTML string
  const html = response?.data; // Replace `...` with your actual HTML content

  // Load the HTML string into cheerio
  const $ = cheerio.load(html);

  // Initialize an empty array to hold the data
  const data = [];
  const dataOnline = [];

  // Parse the table rows
  $("table#offline-tbl tbody tr").each((index, element) => {
    // Skip the last row which contains the update time
    if (!$(element).hasClass("cg_credit")) {
      const bankName = $(element).find("td.sticky_col a").text().trim();
      const values = $(element)
        .find("td.price")
        .map((i, el) => $(el).text().trim() || null)
        .get();

      // Push a new object into the data array
      data.push({
        bankName,
        value0Month: values[0],
        value1Month: values[1],
        value3Month: values[2],
        value6Month: values[3],
        value9Month: values[4],
        value12Month: values[5],
        value13Month: values[6],
        value18Month: values[7],
        value24Month: values[8],
        value36Month: values[9],
        // timeUpdate will be added after this loop
      });
    }
  });
  $("table#online-tbl tbody tr").each((index, element) => {
    // Skip the last row which contains the update time
    if (!$(element).hasClass("cg_credit")) {
      const bankName = $(element).find("td.sticky_col a").text().trim();
      const values = $(element)
        .find("td.price")
        .map((i, el) => $(el).text().trim() || null)
        .get();

      // Push a new object into the data array
      dataOnline.push({
        bankName,
        value0Month: values[0],
        value1Month: values[1],
        value3Month: values[2],
        value6Month: values[3],
        value9Month: values[4],
        value12Month: values[5],
        value13Month: values[6],
        value18Month: values[7],
        value24Month: values[8],
        value36Month: values[9],
        // timeUpdate will be added after this loop
      });
    }
  });

  // Parse the update time
  const timeUpdate = $("table#offline-tbl tbody tr.cg_credit td")
    .text()
    .replace("Chợ Giá cập nhật lúc ", "")
    .trim();

  // Add the timeUpdate to each object in the data array
  data.forEach((obj) => (obj.timeUpdate = timeUpdate));
  dataOnline.forEach((obj) => (obj.timeUpdate = timeUpdate));
  console.log("dataOnline: ", dataOnline);

  // Output the result
  //   console.log(data);
  let filterData = data.filter((item) => item.bankName !== "");
  let filterDataOnline = dataOnline.filter((item) => item.bankName !== "");

  let dataMap = filterData.map((item) => {
    return [...Object.values(item)];
  });
  let dataMapOnline = filterDataOnline.map((item) => {
    return [...Object.values(item)];
  });
  //delete old data
  await query("DELETE FROM lai_suat");
  //insert new data
  await query("INSERT INTO lai_suat VALUES ?", [dataMap]);

  //delete old data
  await query("DELETE FROM lai_suat_online");
  //insert new data
  await query("INSERT INTO lai_suat_online VALUES ?", [dataMapOnline]);
})();
