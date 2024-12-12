const { default: fetch } = require("node-fetch");

(async () => {
  let body = {
    comGroupCode: "All",
    icbCode: "All",
    parameters: [
      {
        name: "Biến động giá 1 ngày",
        code: "PercentPriceChange1Day",
        type: "Range",
        selectedValue: [-0.0899, 0.0732],
        valueRange: [-0.17012448, 0.15],
        unit: "Percentage",
      },
      {
        name: "Biến động giá 1 tuần",
        code: "PercentPriceChange1Week",
        type: "Range",
        selectedValue: [0.2993, 0.7217],
        valueRange: [-0.3576483397, 0.7217391304],
        unit: "Percentage",
      },
    ],
    page: 1,
    pageSize: 30,
    OrderBy: "StockScreenerItem.Ticker",
    Direction: "ASC",
  };
  let response = await fetch(
    "https://fiin-tools.ssi.com.vn/Screener/GetScreenerItems",
    {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "x-fiin-key": "KEY",
        "x-fiin-seed": "SEED",
        "x-fiin-user-id": "ID",
        Referer: "https://iboard.ssi.com.vn/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `${body}`,
      method: "POST",
    }
  );
  let data = await response.json();
  //   console.log("data: ", data);
  let dataFilter = data?.items;
  console.log("dataFilter: ", dataFilter);
})();
