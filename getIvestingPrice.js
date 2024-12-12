const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");

(async () => {
  let response = await fetch("https://vn.investing.com/indices/world-indices");
  let body = await response.text();
  let $ = cheerio.load(body);

  const indices = [
    "Dow Jones",
    "Nasdaq",
    "S&P 500",
    "Hang Seng",
    "Nikkei 225",
    "Shanghai",
    "DAX",
    "HNX30",
    "VN30",
    "VNI",
    "HNX",
    "VN100",
    "Euro Stoxx 50",
    "AEX",
    "IBEX 35",
    "FTSE MIB TR EUR",
    "SMI",
    "S&P/ASX 200",
  ];
  let data = [];

  $("table.genTbl.closedTbl.crossRatesTbl.elpTbl.elp30 tbody tr").each(
    (i, elem) => {
      let indexName = $(elem)
        .find("td.bold.left.noWrap.elp.plusIconTd a")
        .text()
        .trim();
      if (indices.includes(indexName)) {
        let id = $(elem).attr("id").replace("pair_", "");

        let lastIndex = $(`#pair_${id} .pid-${id}-last`).text().trim();
        let high = $(`#pair_${id} .pid-${id}-high`).text().trim();
        let low = $(`#pair_${id} .pid-${id}-low`).text().trim();
        let change = $(`#pair_${id} .pid-${id}-pc`).text().trim();
        let changePct = $(`#pair_${id} .pid-${id}-pcp`).text().trim();
        let time = $(`#pair_${id} .pid-${id}-time`).text().trim();

        data.push({
          name: indexName,
          value: lastIndex,
          high,
          low,
          change,
          percent: changePct,
          time,
          pid: id,
        });
      }
    }
  );

  fs.writeFile(
    "investing.json",
    JSON.stringify(data, null, 2),
    "utf8",
    (err) => {
      if (err) console.log("Error writing file:", err);
    }
  );
})();
