const signalr = require("signalr-client");
const query = require("../common/query.js");
const WebSocket = require("ws");
const batchInsert = require("../common/batchInsert.js");

// Constants
const API = {
  SIGNALR: "signalr",
};

// Helper Functions
function addSlash(str) {
  return str.substr(-1) !== "/" ? str + "/" : str;
}

function resolveURL(baseURL, endpoint) {
  return addSlash(baseURL) + endpoint;
}

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 8000 });
// const wss = new WebSocket.Server({ port: 8080 });

const clientInterests = new Map(); // Map to keep track of client's symbol interest

wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("data: ", data);
    if (data.type === "SUBSCRIBE") {
      clientInterests.set(ws, data.symbol);
    }
  });
  ws.on("close", () => {
    console.log("Client has disconnected");
  });
});

let client = {};
let batchData = [];
let processedDataSignatures = new Set();

exports.initStream = function (options) {
  const url = resolveURL(options.url, API.SIGNALR);
  client = new signalr.client(url, ["FcMarketDataV2Hub"], 10, true);

  client.headers["Authorization"] = options.token;

  client.on("FcMarketDataV2Hub", "Broadcast", async function (message) {
    const data = JSON.parse(message);
    const content = JSON.parse(data.Content);
    // console.log("content: ", content);

    if (content?.RType === "X" && content?.Symbol) {
      handleTypeX(content);
    }

    // Expand on other RTypes as necessary
  });

  client.on("FcMarketDataV2Hub", "Reconnected", function (message) {
    console.log("Reconnected" + message);
  });

  client.on("FcMarketDataV2Hub", "Disconnected", function (message) {
    console.log("Disconnected" + message);
  });

  client.on("FcMarketDataV2Hub", "Error", function (message) {
    console.log(message);
  });
};

async function handleTypeX(content) {
  const type = determineType(content);

  // Insert content to mua_ban_chu_dong_table
  const data = {
    symbol: content.Symbol,
    TradingDate: content.TradingDate,
    Time: content.Time,
    Ceiling: content.Ceiling,
    Floor: content.Floor,
    RefPrice: content.RefPrice,
    Open: content.Open,
    High: content.High,
    Low: content.Low,
    Close: content.Close,
    AvgPrice: typeof content.AvgPrice === "number" ? content.AvgPrice : null,
    // AvgPrice: content.AvgPrice == NaN ? null : content.AvgPrice,
    PriorVal: content.PriorVal,
    LastPrice: content.LastPrice,
    LastVol: content.LastVol,
    TotalVal: content.TotalVal,
    TotalVol: content.TotalVol,
    BidPrice1: content.BidPrice1,
    BidPrice2: content.BidPrice2,
    BidPrice3: content.BidPrice3,
    BidPrice4: content.BidPrice4,
    BidPrice5: content.BidPrice5,
    BidPrice6: content.BidPrice6,
    BidPrice7: content.BidPrice7,
    BidPrice8: content.BidPrice8,
    BidPrice9: content.BidPrice9,
    BidPrice10: content.BidPrice10,
    BidVol1: content.BidVol1,
    BidVol2: content.BidVol2,
    BidVol3: content.BidVol3,
    BidVol4: content.BidVol4,
    BidVol5: content.BidVol5,
    BidVol6: content.BidVol6,
    BidVol7: content.BidVol7,
    BidVol8: content.BidVol8,
    BidVol9: content.BidVol9,
    BidVol10: content.BidVol10,
    AskPrice1: content.AskPrice1,
    AskPrice2: content.AskPrice2,
    AskPrice3: content.AskPrice3,
    AskPrice4: content.AskPrice4,
    AskPrice5: content.AskPrice5,
    AskPrice6: content.AskPrice6,
    AskPrice7: content.AskPrice7,
    AskPrice8: content.AskPrice8,
    AskPrice9: content.AskPrice9,
    AskPrice10: content.AskPrice10,
    AskVol1: content.AskVol1,
    AskVol2: content.AskVol2,
    AskVol3: content.AskVol3,
    AskVol4: content.AskVol4,
    AskVol5: content.AskVol5,
    AskVol6: content.AskVol6,
    AskVol7: content.AskVol7,
    AskVol8: content.AskVol8,
    AskVol9: content.AskVol9,
    AskVol10: content.AskVol10,
    MarketId: content.MarketId,
    Exchange: content.Exchange,
    TradingSession: content.TradingSession,
    TradingStatus: content.TradingStatus,
    Change: content.Change,
    RatioChange:
      typeof content.RatioChange === "number" ? content.RatioChange : null,
    EstMatchedPrice: content.EstMatchedPrice,
    type:
      content.TradingSession === "ATO"
        ? "ATO"
        : content.TradingSession === "ATC"
        ? "ATC"
        : type,
  };

  // Construct a signature to check for duplicates
  const dataSignature = `${data.symbol}_${data.TotalVal}`;

  // Check for duplicate data in processedDataSignatures
  const isDuplicate = processedDataSignatures.has(dataSignature);
  // if (data.symbol === "SSI") {
  // }
  // If data is not a duplicate, send to WebSocket clients, add to batch and processedDataSignatures
  if (true) {
    // if (!isDuplicate) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const clientSymbol = clientInterests.get(client);
        if (clientSymbol && content.Symbol === clientSymbol) {
          client.send(JSON.stringify({ ...data, isDuplicate: isDuplicate }));
        }
      }
    });
    // Add data to batch
    batchData.push(data);
    processedDataSignatures.add(dataSignature);

    // If batch reaches a certain size, insert and clear batch
    if (batchData.length >= 500) {
      batchInsert("mua_ban_chu_dong", batchData);
      batchData = [];
    }
  }
}

function determineType(content) {
  if (content?.LastPrice >= content?.AskPrice1) {
    return "B";
  } else if (content?.LastPrice <= content?.BidPrice1) {
    return "S";
  }
  return "";
}

exports.streamClient = client;

exports.start = function start() {
  client.start();
  return client;
};
