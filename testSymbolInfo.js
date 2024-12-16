/** @START_CONFIG */
const express = require("express");
const config = require("./config.js");
const marketStreaming = require("./Streamings/marketStreamingTest");
const axios = require("axios");
const app = express();
const port = 3030;
/** @END_CONFIG */

app.get("/Securities", (req, res) => {
  const { pageIndex, pageSize } = req.query;
  let lookupRequest = {};
  lookupRequest.market = "";
  lookupRequest.pageIndex = pageIndex;
  lookupRequest.pageSize = pageSize;

  axios
    .get(
      config.market.ApiUrl +
        "Securities?lookupRequest.market=" +
        lookupRequest.market +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/SecuritiesDetails", (req, res) => {
  const { pageIndex, pageSize } = req.query;
  let lookupRequest = {};
  lookupRequest.market = "";
  lookupRequest.symbol = "";
  lookupRequest.pageIndex = pageIndex;
  lookupRequest.pageSize = pageSize;

  axios
    .get(
      config.market.ApiUrl +
        "SecuritiesDetails" +
        "?lookupRequest.market=" +
        lookupRequest.market +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize +
        "&lookupRequest.symbol=" +
        lookupRequest.symbol
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/IndexComponents", (req, res) => {
  let lookupRequest = {};
  lookupRequest.indexCode = "";
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 1000;

  axios
    .get(
      config.market.ApiUrl +
        "IndexComponents" +
        "?lookupRequest.indexCode=" +
        lookupRequest.indexCode +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/IndexList", (req, res) => {
  let lookupRequest = {};
  lookupRequest.exchange = "HOSE";
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 1000;

  axios
    .get(
      config.market.ApiUrl +
        "IndexList" +
        "?lookupRequest.exchange=" +
        lookupRequest.exchange +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/DailyOhlc", (req, res) => {
  const { symbol, fromDate, toDate } = req.query;
  let lookupRequest = {};
  lookupRequest.symbol = symbol;
  lookupRequest.fromDate = fromDate;
  lookupRequest.toDate = toDate;
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 1000;
  lookupRequest.ascending = true;

  axios
    .get(
      config.market.ApiUrl +
        "DailyOhlc" +
        "?lookupRequest.symbol=" +
        lookupRequest.symbol +
        "&lookupRequest.fromDate=" +
        lookupRequest.fromDate +
        "&lookupRequest.toDate=" +
        lookupRequest.toDate +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize +
        "&lookupRequest.ascending=" +
        lookupRequest.ascending
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/IntradayOhlc", (req, res) => {
  const { symbol, fromDate, toDate } = req.query;
  let lookupRequest = {};
  lookupRequest.symbol = symbol;
  lookupRequest.fromDate = fromDate;
  lookupRequest.toDate = toDate;
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 5000;
  lookupRequest.ascending = false;

  axios
    .get(
      config.market.ApiUrl +
        "IntradayOhlc" +
        "?lookupRequest.symbol=" +
        lookupRequest.symbol +
        "&lookupRequest.fromDate=" +
        lookupRequest.fromDate +
        "&lookupRequest.toDate=" +
        lookupRequest.toDate +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize +
        "&lookupRequest.ascending=" +
        lookupRequest.ascending
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/DailyIndex", (req, res) => {
  let lookupRequest = {};
  lookupRequest.indexId = "HNX30";
  lookupRequest.fromDate = "20/01/2021";
  lookupRequest.toDate = "27/01/2021";
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 1000;
  lookupRequest.ascending = true;

  axios
    .get(
      config.market.ApiUrl +
        "DailyIndex" +
        "?lookupRequest.indexId=" +
        lookupRequest.indexId +
        "&lookupRequest.fromDate=" +
        lookupRequest.fromDate +
        "&lookupRequest.toDate=" +
        lookupRequest.toDate +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize +
        "&lookupRequest.ascending=" +
        lookupRequest.ascending
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/DailyStockPrice", (req, res) => {
  const { symbol, fromDate, toDate } = req.query;
  let lookupRequest = {};
  lookupRequest.symbol = symbol;
  lookupRequest.market = "";
  lookupRequest.fromDate = fromDate;
  lookupRequest.toDate = toDate;
  lookupRequest.pageIndex = 1;
  lookupRequest.pageSize = 1000;

  axios
    .get(
      config.market.ApiUrl +
        "DailyStockPrice" +
        "?lookupRequest.symbol=" +
        lookupRequest.symbol +
        "&lookupRequest.fromDate=" +
        lookupRequest.fromDate +
        "&lookupRequest.toDate=" +
        lookupRequest.toDate +
        "&lookupRequest.pageIndex=" +
        lookupRequest.pageIndex +
        "&lookupRequest.pageSize=" +
        lookupRequest.pageSize +
        "&lookupRequest.market=" +
        lookupRequest.market
    )
    .then((response) => {
      res.send(JSON.parse(JSON.stringify(response.data)));
    })
    .catch((error) => {
      console.log(error);
    });
});

const rq = axios.create({
  baseURL: config.market.ApiUrl,
  timeout: 5000,
});

rq({
  url: config.market.ApiUrl + "AccessToken",
  method: "post",
  data: {
    consumerID: config.market.id,
    consumerSecret: config.market.priKey,
  },
}).then(
  (response) => {
    if (response.data.status === 200) {
      let token = "Bearer " + response.data.data.accessToken;
      axios.interceptors.request.use(function (axios_config) {
        axios_config.headers.Authorization = token;
        return axios_config;
      });

      marketStreaming.initStream({
        url: config.market.HubUrl,
        token: token,
      });

      var mkClient = marketStreaming.start();

      mkClient.serviceHandlers.connected = function (connection) {
        mkClient.invoke(
          "FcMarketDataV2Hub",
          "SwitchChannels",
          "X-QUOTE:ALL,X:ALL,B:ALL"
          // "B:ALL",
          // "X: ALL"
          // "X:ALL"
        );
      };

      mkClient.serviceHandlers.reconnecting = function (connection) {
        mkClient.invoke(
          "FcMarketDataV2Hub",
          "SwitchChannels",
          // "X:ALL"
          "X-QUOTE:ALL,X:ALL,B:ALL"
          // "B:ALL",
          // "X:ALL"
        );
      };
    } else {
      console.log(response.data.message);
    }
  },
  (reason) => {
    console.log("aaa: ", reason);
  }
);

app.listen(port, "localhost", () =>
  console.log(`Example app listening on port ${port}!`)
);
