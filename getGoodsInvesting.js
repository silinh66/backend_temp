const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");

(async () => {
  let response = await fetch(
    "https://vn.investing.com/commodities/real-time-futures"
  );
  let body = await response.text();
  let $ = cheerio.load(body);

  const indices = [
    "Vàng",
    "XAU/USD",
    "Bạc",
    "Đồng",
    "Platin",
    "Paladi",
    "Dầu Thô WTI",
    "Dầu Brent",
    "Khí Tự nhiên",
    "Dầu Nhiên liệu",
    "Xăng RBOB",
    "Nhôm",
    "Kẽm",
    "Ni-ken",
    "Copper",
    "Lúa mì Hoa Kỳ",
    "Thóc",
    "Bắp Hoa Kỳ",
    "Nước Cam",
    "Bê",
    "Heo nạc",
    "Bê đực non",
    "Gỗ",
    "Yến mạch",
  ];
  let data = [];

  $(".datatable_row__Hk3IV.dynamic-table_row__fdxP8").each((i, elem) => {
    let name = $(elem).find(".datatable_cell--name__link__2xqgx").text().trim();
    if (indices.includes(name)) {
      let last = $(elem)
        .children(".datatable_cell--align-end__qgxDQ")
        .eq(1)
        .text()
        .trim();
      let high = $(elem)
        .children(".datatable_cell--align-end__qgxDQ")
        .eq(2)
        .text()
        .trim();
      let low = $(elem)
        .children(".datatable_cell--align-end__qgxDQ")
        .eq(3)
        .text()
        .trim();
      let change = $(elem)
        .children(".datatable_cell--align-end__qgxDQ")
        .eq(4)
        .text()
        .trim();
      let changePct = $(elem)
        .children(".datatable_cell--align-end__qgxDQ")
        .eq(5)
        .text()
        .trim();
      let time = $(elem)
        .find(".dynamic-table_timeWrapper__w9fFK time")
        .text()
        .trim();

      data.push({
        name,
        value: last,
        high,
        low,
        change,
        percent: changePct,
        time,
        pid: "",
      });
    }
  });

  fs.writeFile(
    "commodities.json",
    JSON.stringify(data, null, 2),
    "utf8",
    (err) => {
      if (err) console.log("Error writing file:", err);
    }
  );
})();
