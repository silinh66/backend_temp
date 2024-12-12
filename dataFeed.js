const express = require("express");
const cors = require("cors");
const query = require("./common/query");
const axios = require("axios");
const fs = require("fs");
const moment = require("moment");
const { ZenRows } = require("zenrows");
const { isProduct } = require("./constants/isProduct");
const bodyParser = require("body-parser");
const { endpoint } = require("./constants/api");
const app = express();
// const getLatestDate = require("./utils/getLatestDate");
var whitelist = [
  "http://103.196.144.131:5001",
  "http://185.250.36.147",
  "https://185.250.36.147",
  "http://185.250.36.147:3003",
  "https://185.250.36.147:3003",
  "http://localhost:3003", // Add this line
];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// app.use(cors(isProduct ? corsOptions : { origin: "http://localhost:5001" }));
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  })
);
app.use(bodyParser.json({ type: "application/json" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.all("*", function (req, res, next) {
  /**
   * Response settings
   * @type {Object}
   */
  var responseSettings = {
    AccessControlAllowOrigin: req.headers.origin,
    AccessControlAllowHeaders:
      "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
    AccessControlAllowMethods: "POST, GET, PUT, DELETE, OPTIONS",
    AccessControlAllowCredentials: true,
  };

  /**
   * Headers
   */
  res.header(
    "Access-Control-Allow-Credentials",
    responseSettings.AccessControlAllowCredentials
  );
  res.header(
    "Access-Control-Allow-Origin",
    responseSettings.AccessControlAllowOrigin
  );
  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"]
      ? req.headers["access-control-request-headers"]
      : "x-requested-with"
  );
  res.header(
    "Access-Control-Allow-Methods",
    req.headers["access-control-request-method"]
      ? req.headers["access-control-request-method"]
      : responseSettings.AccessControlAllowMethods
  );

  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
});
const PORT = 5050;

// Middleware to log incoming requests
// app.use((req, res, next) => {
//   console.log(`${req.method} request for '${req.url}'`);
//   next();
// });

app.get("/history", async (req, res) => {
  const { symbol, resolution, from, to, countback } = req.query;

  if (!symbol || !resolution || !from || !to || !countback) {
    return res.status(400).json({ error: "Missing required parameters." });
  }
  if (symbol === "GC=F") {
    console.log("aaaaaaaaaa");
    let resolutionType = resolution === "1D" ? "D" : "1";
    let query = `https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=${resolutionType}&from=${from}&to=${to}`;
    console.log("query: ", query);
    const client = new ZenRows("c774641bbd0fb41b3489ef7ebc18bc1859eca0c4");
    const url =
      "https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=1&from=1697431278&to=1697517738";

    try {
      const { data } = await client.get(url, {});
      let dataMap = {
        c: data.c.map((item) => +item.toFixed(2)),
        h: data.h.map((item) => +item.toFixed(2)),
        l: data.l.map((item) => +item.toFixed(2)),
        o: data.o.map((item) => +item.toFixed(2)),
        s: "ok",
        t: data.t,
        v: data.v.map((item) => 1000),
      };
      res.json(dataMap);
    } catch (error) {
      console.error(error.message);
      if (error.response) {
        console.error(error.response.data);
      }
    }
    return;
  }

  //VNDIRECT
  try {
    let resolutionType = resolution === "1D" ? "D" : "1";
    let query = `https://dchart-api.vndirect.com.vn/dchart/history?symbol=${symbol}&resolution=${resolutionType}&from=${from}&to=${to}`;
    console.log("query: ", query);
    let listSymbolData = await axios.get(query);
    const filteredData = {
      t: [],
      c: [],
      o: [],
      h: [],
      l: [],
      v: [],
      s: "ok",
    };
    let data = listSymbolData.data;
    // for (let i = 0; i < data.v.length; i++) {
    //   if (data.v[i] !== 0) {
    //     filteredData.t.push(data.t[i]);
    //     filteredData.c.push(data.c[i]);
    //     filteredData.o.push(data.o[i]);
    //     filteredData.h.push(data.h[i]);
    //     filteredData.l.push(data.l[i]);
    //     filteredData.v.push(data.v[i]);
    //   }
    // }
    res.json(data);
  } catch (error) {
    console.log("error: ", error);
    res.json({});
  }

  // //FINPATH
  // try {
  //   let resolutionType = resolution === "1D" ? "1d" : "1";
  //   let query = `https://api.finpath.vn/api/tradingview/v2/bars/SSI?start=1675123200000&end=${to}&timeframe=${resolutionType}&countBack=300`;
  //   // let query = `https://dchart-api.vndirect.com.vn/dchart/history?symbol=${symbol}&resolution=${resolutionType}&from=${from}&to=${to}`;
  //   console.log("query: ", query);
  //   let listSymbolData = await axios.get(query);
  //   const filteredData = {
  //     t: [],
  //     c: [],
  //     o: [],
  //     h: [],
  //     l: [],
  //     v: [],
  //     s: "ok",
  //   };
  //   let data = listSymbolData?.data?.data?.bars;
  //   // console.log("data: ", data);
  //   for (let i = 0; i < data.length; i++) {
  //     if (data[4] !== 0) {
  //       filteredData.t.push(data[i][5]);
  //       filteredData.c.push(data[i][3]);
  //       filteredData.o.push(data[i][0]);
  //       filteredData.h.push(data[i][1]);
  //       filteredData.l.push(data[i][2]);
  //       filteredData.v.push(data[i][4]);
  //     }
  //   }
  //   console.log("filteredData: ", filteredData);
  //   res.json(filteredData);
  // } catch (error) {
  //   console.log("error: ", error);
  //   res.json({});
  // }
});

const getNewPrice = async (symbol) => {
  let fromDate = moment().subtract(1, "days").format("DD/MM/YYYY");
  let toDate = moment().format("DD/MM/YYYY");
  console.log(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  console.time("getNewPrice");
  let response = await axios.get(
    `http://localhost:3020/DailyOhlc?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  console.timeEnd("getNewPrice");

  let listSymbol = response.data.data;
  if (listSymbol?.length > 0) {
    return listSymbol[listSymbol.length - 1];
  } else {
    return null;
  }
};

app.get("/search", async (req, res) => {
  const { limit, query } = req.query;
  try {
    let listSymbol = await axios.get(
      `https://dchart-api.vndirect.com.vn/dchart/search?limit=${limit}&query=${query}&type=&exchange=`
    );
    return res.json(listSymbol.data);
  } catch (error) {}
  // let listSymbolData = [];

  // let response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  // );
  // listSymbolData = response?.data?.data || listSymbolData;
  // response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  // );
  // listSymbolData = response.data.data
  //   ? [...listSymbolData, ...response.data.data]
  //   : listSymbolData;
  // let listSymbolMap = listSymbolData.map((item) => {
  //   return {
  //     symbol: item?.Symbol,
  //     full_name: item?.Symbol,
  //     description: item?.StockName,
  //     exchange: item?.Market,
  //     type: "Cổ phiếu",
  //     exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
  //   };
  // });
  // // console.log("listSymbolMap: ", listSymbolMap);
  // const filteredResults = listSymbolMap.filter((data) =>
  //   data.symbol.includes(query)
  // );

  // const limitedResults = filteredResults.slice(
  //   0,
  //   parseInt(limit) || filteredResults.length
  // );
  // if (query) {
  //   return res.json(limitedResults);
  // } else {
  //   return res.json(listSymbolMap);
  // }
});

app.get("/symbols", async (req, res) => {
  const symbol = req.query.symbol;
  let listSymbolData = [];

  // let response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  // );
  // listSymbolData = response?.data?.data || listSymbolData;
  //  //wait 1s
  //  await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
  // response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  // );
  let response = await query("SELECT * from symbol_info");

  listSymbolData = response;
  try {
    // let ssiInfoResponse = await axios.get(
    //   `https://iboard-query.ssi.com.vn/stock/${symbol}`
    // );
    // let ssiInfo = ssiInfoResponse.data.data;
    // listSymbolData = response.data.data
    //   ? [...listSymbolData, ...response.data.data]
    //   : listSymbolData;
    let listSymbolMap = listSymbolData.map((item) => {
      return {
        name: item?.symbol,
        "exchange-traded": item?.exchange,
        "exchange-listed": item?.exchange,
        timezone: "Asia/Ho_Chi_Minh",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "24x7",
        has_intraday: true,
        visible_plots_set: "ohlcv",
        // description: ssiInfo?.companyNameVi,
        description: item?.description,
        type: "Cổ phiếu",
        supported_resolutions: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "10",
          "15",
          "20",
          "25",
          "30",
          "45",
          "90",
          "1h",
          "2h",
          "3h",
          "4h",
          "D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "3M",
          "6M",
          "12M",
        ],
        pricescale: 100,
        ticker: item?.Symbol,
        logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
        exchange_logo: item?.exchange_logo,
      };
    });
    let pickedSymbol;
    pickedSymbol = listSymbolMap.find((item) => item.name === symbol);
    if (!pickedSymbol) {
      pickedSymbol = {
        name: symbol,
        "exchange-traded": "HOSE",
        "exchange-listed": "HOSE",
        timezone: "Asia/Ho_Chi_Minh",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "24x7",
        has_intraday: true,
        visible_plots_set: "ohlcv",
        // description: ssiInfo?.companyNameVi,
        description: symbol,
        type: "Chỉ số",
        supported_resolutions: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "10",
          "15",
          "20",
          "25",
          "30",
          "45",
          "90",
          "1h",
          "2h",
          "3h",
          "4h",
          "D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "3M",
          "6M",
          "12M",
        ],
        pricescale: 100,
        ticker: symbol,
        logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
        exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
      };
    }

    // if (
    //   symbol === "VNINDEX" ||
    //   symbol === "VN30" ||
    //   symbol === "VN30F1M" ||
    //   symbol === "VN30F1Q" ||
    //   symbol === "VN30F2M" ||
    //   symbol === "VN30F2Q"
    // ) {
    //   pickedSymbol = {
    //     name: symbol,
    //     "exchange-traded": "HOSE",
    //     "exchange-listed": "HOSE",
    //     timezone: "Asia/Ho_Chi_Minh",
    //     minmov: 1,
    //     minmov2: 0,
    //     pointvalue: 1,
    //     session: "24x7",
    //     has_intraday: true,
    //     visible_plots_set: "ohlcv",
    //     // description: ssiInfo?.companyNameVi,
    //     description: symbol,
    //     type: "Chỉ số",
    //     supported_resolutions: [
    //       "1",
    //       "2",
    //       "3",
    //       "4",
    //       "5",
    //       "10",
    //       "15",
    //       "20",
    //       "25",
    //       "30",
    //       "45",
    //       "90",
    //       "1h",
    //       "2h",
    //       "3h",
    //       "4h",
    //       "D",
    //       "2D",
    //       "3D",
    //       "W",
    //       "2W",
    //       "M",
    //       "3M",
    //       "6M",
    //       "12M",
    //     ],
    //     pricescale: 100,
    //     ticker: symbol,
    //     logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
    //     exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
    //   };
    // } else if (
    //   symbol === "VNINDEX" ||
    //   symbol === "VN30" ||
    //   symbol === "VN30F1M" ||
    //   symbol === "VN30F1Q" ||
    //   symbol === "VN30F2M" ||
    //   symbol === "VN30F2Q"
    // ) {
    //   pickedSymbol = {
    //     name: symbol,
    //     "exchange-traded": "HOSE",
    //     "exchange-listed": "HOSE",
    //     timezone: "Asia/Ho_Chi_Minh",
    //     minmov: 1,
    //     minmov2: 0,
    //     pointvalue: 1,
    //     session: "24x7",
    //     has_intraday: true,
    //     visible_plots_set: "ohlcv",
    //     // description: ssiInfo?.companyNameVi,
    //     description: symbol,
    //     type: "Chỉ số",
    //     supported_resolutions: [
    //       "1",
    //       "2",
    //       "3",
    //       "4",
    //       "5",
    //       "10",
    //       "15",
    //       "20",
    //       "25",
    //       "30",
    //       "45",
    //       "90",
    //       "1h",
    //       "2h",
    //       "3h",
    //       "4h",
    //       "D",
    //       "2D",
    //       "3D",
    //       "W",
    //       "2W",
    //       "M",
    //       "3M",
    //       "6M",
    //       "12M",
    //     ],
    //     pricescale: 100,
    //     ticker: symbol,
    //     logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
    //     exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
    //   };
    // } else {
    //   pickedSymbol = listSymbolMap.find((item) => item.name === symbol);
    // }
    console.log("pickedSymbol: ", pickedSymbol);
    if (!!pickedSymbol) {
      res.json(pickedSymbol);
    } else {
      res.status(404).json({
        error: "Symbol not found",
      });
    }
  } catch (error) {
    console.log("error: ", error);
    res.json({});
  }
});

// Configuration Endpoint
app.get("/config", (req, res) => {
  res.json({
    supports_search: true,
    supports_group_request: false,
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [
      {
        value: "",
        name: "All Exchanges",
        desc: "",
      },
      {
        value: "HSX",
        name: "Sàn giao dịch chứng khoán TP HCM",
        desc: "HSX",
      },
      {
        value: "NYMEX",
        name: "Sàn NYMEX",
        desc: "NYMEX",
      },
      {
        value: "HNX",
        name: "Sàn giao dịch chứng khoán Hà Nội",
        desc: "HNX",
      },
      {
        value: "COMEX",
        name: "Sàn COMEX",
        desc: "COMEX",
      },
      {
        value: "UPCOM",
        name: "Sàn giao dịch chứng khoán UPCOM",
        desc: "UPCOM",
      },
      {
        value: "ICEUS",
        name: "Sàn ICEUS",
        desc: "ICEUS",
      },
      {
        value: "CBOT",
        name: "Sàn CBOT",
        desc: "CBOT",
      },
      {
        value: "WORLD",
        name: "Sàn thế giới",
        desc: "WORLD",
      },
    ],
    symbols_types: [
      {
        name: "Tất cả",
        value: "",
      },
      {
        name: "Cổ phiếu",
        value: "stock",
      },
      {
        name: "Index",
        value: "index",
      },
    ],
    supported_resolutions: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "10",
      "15",
      "20",
      "25",
      "30",
      "45",
      "90",
      "1h",
      "2h",
      "3h",
      "4h",
      "D",
      "2D",
      "3D",
      "W",
      "2W",
      "M",
      "3M",
      "6M",
      "12M",
    ],
  });
});

// Server time Endpoint
app.get("/time", (req, res) => {
  const serverTime = Math.floor(Date.now() / 1000);
  res.send(serverTime.toString());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on ${endpoint}:${PORT}`);
});
