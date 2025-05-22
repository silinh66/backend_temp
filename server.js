var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var cors = require("cors");
const nodemailer = require("nodemailer");
var cron = require("node-cron");
const WebSocket = require("ws");
const TelegramBot = require("node-telegram-bot-api");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const https = require("https");

const httpsAgent = new https.Agent({ family: 4 });
const cheerio = require("cheerio");
const { isProduct } = require("./constants/isProduct");
const fetch = require("node-fetch");
const path = require("path");
const twilio = require("twilio");

const randomize = require("randomatic");
require("dotenv").config();

let { groupDataByTime } = require("./convert");
const telegramBotToken = "6081064704:AAGpOoJig4bTO7-TQlfac6WOHpv81TOUXDI";
const bot = new TelegramBot(telegramBotToken, { polling: false });
let chat_id = isProduct ? ["-955808797"] : ["-955808797"];

const { default: axios } = require("axios");
const { groupBy, delay } = require("lodash");
const moment = require("moment");

const fs = require("fs");

const ma = require("moving-averages");

const boll = require("bollinger-bands");

const SMA = require("technicalindicators").SMA;

var BB = require("technicalindicators").BollingerBands;

var RSI = require("technicalindicators").RSI;

const EMA = require("technicalindicators").EMA;
const MFI = require("technicalindicators").MFI;
const ADX = require("technicalindicators").ADX;
const StochasticRSI = require("technicalindicators").StochasticRSI;
const Stochastic = require("technicalindicators").Stochastic;
const WilliamsR = require("technicalindicators").WilliamsR;
const MACD = require("technicalindicators").MACD;
const query = require("./common/query");

// Function to convert date string from dd/mm/yyyy to yyyy-mm-dd
function convertDateToISO(dateStr) {
  const parts = dateStr.split("/");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// const getLatestDate = require("./utils/getLatestDate");
var whitelist = [
  "http://103.196.144.131:5001",
  "http://185.250.36.147",
  "https://185.250.36.147",
  "http://185.250.36.147:3003",
  "https://185.250.36.147:3003",
  "http://localhost:3003",
  "http://192.168.0.101:3000",
  "http://89.117.57.15:3003",
  "https://89.117.57.15:3003",
  "http://192.168.0.101:3000",
  "http://192.168.1.221:3004",
  "http://192.168.1.221:3003",
  "http://100.102.19.68",
  "http://100.102.19.68:80",
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

app.use(cors(isProduct ? corsOptions : { origin: "*" }));
// app.use(
//   cors({
//     origin: "*", // Allow all origins
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
//   })
// );
app.use(bodyParser.json({ type: "application/json", limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// Biến cấu hình delay
let enableDelay = false;
let delayDuration = 100; // Thời gian delay trong milliseconds

// Hàm delay mới
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Middleware delay
const delayMiddleware = async (req, res, next) => {
  if (enableDelay) {
    await pause(delayDuration);
  }
  next();
};

// Sử dụng middleware trong ứng dụng Express
app.use(delayMiddleware);
// Phục vụ các file tĩnh từ thư mục 'bctc'
app.use("/bctc", express.static(path.join(__dirname, "bctc")));
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

//chat socket realtime
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
const port = process.env.PORT_CHAT || 5757; // Use 3000 as default if PORT_CHAT is not defined

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${process.env.PORT_CHAT}`);
});
//Home socket realtime
const serverHome = http.createServer(app);
const ioHome = socketIo(serverHome, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
const portHome = process.env.PORT_HOME || 5858; // Use 3000 as default if PORT_CHAT is not defined

serverHome.listen(portHome, "0.0.0.0", () => {
  console.log(`Listening HOME on port ${process.env.PORT_HOME}`);
});

let rawConfig = fs.readFileSync("listConfig.json");
var listConfig = JSON.parse(rawConfig);

const listIntervals = [
  { interval: "1m", seconds: 60 },
  { interval: "5m", seconds: 300 },
  { interval: "15m", seconds: 900 },
  { interval: "30m", seconds: 1800 },
  { interval: "1h", seconds: 3600 },
  { interval: "2h", seconds: 7200 },
  { interval: "4h", seconds: 14400 },
  { interval: "12h", seconds: 43200 },
  { interval: "1d", seconds: 86400 },
  { interval: "3d", seconds: 259200 },
  { interval: "1w", seconds: 604800 },
  { interval: "1M", seconds: 2592000 },
];

// let listMatchRSIUp = [];
// let listMatchRSIDown = [];

// let listMatchMA = [];
// let listMatchRSI = [];
// let listMatchMACD = [];

// Middleware to authenticate and decode the JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there's no token

  jwt.verify(token, process.env.SECRET, (err, user) => {
    // if (err === "TokenExpiredError: jwt expired") {
    //   return res.status(403).send({ error: true, message: "Token expired" });
    // }
    // if (err) return res.sendStatus(403); // if the token is not valid
    if (err) {
      // Check if the error is because the JWT expired
      if (err.name === "TokenExpiredError") {
        return res.status(403).send({ error: true, message: "Token expired" });
      }
      // For any other errors, return a generic 403 Forbidden
      return res.status(403).send({ error: true, message: "Forbidden" });
    }
    req.user = user;
    next();
  });
};
const emailConfig = "dautubenvung.vn@gmail.com";
// const emailDocument = 'dautubenvung.academy@hotmail.com'
const passwordConfig = "hubh heze kuua wkwg";
app.get("/", function (req, res) {
  return res.send({ error: false, message: "hello from Đầu Tư Bền Vững" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", function () {
  console.log("Node app is running on port 5000");
});
app.post("/send-code-email", (req, res) => {
  const { email } = req.body;
  let passcode = randomize("0", 6);
  if (email) {
    // Gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailConfig,
        pass: passwordConfig,
      },
    });
    const mailOptions = {
      from: `Đầu Tư Bền Vững ${emailConfig}`,
      to: email,
      subject: "Không chia sẻ mã này cho bất kỳ ai!",
      text: `Mã của bạn là: ${passcode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to send passcode via email" });
      } else {
        console.log("Email sent: " + info.response);
        res
          .status(200)
          .json({ message: "Passcode sent successfully", passcode });
      }
    });
  } else {
    res.status(400).json({ message: "No contact info provided" });
  }
});

app.post("/change-password-contact", async (req, res) => {
  const { contact, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  let response;
  if (validateEmail(contact)) {
    response = await query("UPDATE users SET password = ? WHERE email = ?", [
      password_hash,
      contact,
    ]);
  } else if (validatePhoneNumber(contact)) {
    response = await query(
      "UPDATE users SET password = ? WHERE phone_number = ?",
      [password_hash, contact]
    );
  } else {
    return res.status(400).send("Invalid contact information");
  }

  if (!response) {
    return res.status(500).send("Failed to update password");
  }
  return res.status(200).json({ message: "Đổi pass thành công!" });
});
app.get("/bctc/:symbol/:filename", function (req, res) {
  const symbol = req.params.symbol;
  const filename = req.params.filename;
  const fileDirectory = path.join(__dirname, "bctc", symbol, filename);

  // Kiểm tra file tồn tại
  fs.access(fileDirectory, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found: " + fileDirectory);
      return res.status(404).send("File not found");
    }

    // Thiết lập header để tải file
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + filename + '"'
    );
    res.setHeader("Content-Type", "application/pdf");

    // Gửi file
    res.sendFile(fileDirectory);
  });
});

app.get("/getTopics/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sortOpts = ["newest", "most_interacted"];
  const sort = sortOpts.includes(req.query.sort)
    ? req.query.sort
    : "newest";
  const offset = (page - 1) * limit;

  let orderBy = "topics.created_at DESC";
  if (sort === "most_interacted") {
    orderBy = "(like_count + comment_count) DESC";
  }

  const topicsSql = `
    SELECT 
      topics.*,
      users.name    AS author,
      users.image   AS avatar,
      COUNT(DISTINCT views_topic.topic_id)    AS view_count,
      COUNT(DISTINCT likes_topic.like_id)     AS like_count,
      COUNT(DISTINCT comments_topic.comment_id) AS comment_count
    FROM topics
    JOIN users   ON topics.userId = users.userId
    LEFT JOIN views_topic    ON views_topic.topic_id   = topics.topic_id
    LEFT JOIN likes_topic    ON likes_topic.topic_id   = topics.topic_id
    LEFT JOIN comments_topic ON comments_topic.topic_id= topics.topic_id
    WHERE topics.symbol_name = ?
    GROUP BY topics.topic_id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM topics
    WHERE symbol_name = ?
  `;

  try {
    // 1) Lấy topics & tổng
    const [rawTopics, countRes] = await Promise.all([
      query(topicsSql, [symbol, limit, offset]),
      query(countSql, [symbol])
    ]);
    const total = countRes[0]?.total || 0;

    // 2) Parse trường image từ JSON string => JS array
    // sau khi lấy rawTopics từ DB
    const topics = rawTopics.map(t => {
      let imgs = [];

      if (t.image) {
        if (typeof t.image === "string") {
          try {
            // thử parse JSON
            const parsed = JSON.parse(t.image);
            // nếu parse ra array thì dùng luôn, không thì wrap lại
            imgs = Array.isArray(parsed) ? parsed : [t.image];
          } catch {
            // parse lỗi => coi như 1 string URL, gói vào array
            imgs = [t.image];
          }
        } else if (Array.isArray(t.image)) {
          // MySQL JSON column đã parse sẵn thành array
          imgs = t.image;
        }
      }

      return {
        ...t,
        image: imgs    // luôn là string[]
      };
    });


    // 3) Lấy chi tiết likes để enrich
    const topicIds = topics.map(t => t.topic_id);
    let likes = [];
    if (topicIds.length) {
      const likesSql = `
        SELECT 
          likes_topic.topic_id,
          users.userId,
          users.name,
          users.image AS avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id IN (?)
      `;
      likes = await query(likesSql, [topicIds]);
    }

    // 4) Map likes vào mỗi topic
    const likesMap = {};
    likes.forEach(l => {
      likesMap[l.topic_id] ??= [];
      likesMap[l.topic_id].push({
        userId: l.userId,
        name: l.name,
        avatar: l.avatar
      });
    });

    // 5) Gán thêm mảng likes vào từng topic
    const enriched = topics.map(t => ({
      ...t,
      likes: likesMap[t.topic_id] || []
    }));

    // 6) Trả về client
    return res.json({
      success: true,
      total,
      topics: enriched
    });

  } catch (err) {
    console.error("Error fetching topics:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Server error"
    });
  }
});


//follow a topic
app.post("/followTopic", authenticateToken, async (req, res) => {
  const symbol = req.body.symbol;
  const userId = req.user.userId;

  const sql = "INSERT INTO follows_topic (userId, `symbol`) VALUES (?, ?)";
  await query(sql, [userId, symbol]);
  res.json({ success: true, message: "Topic followed" });
});

//unfollow a topic
app.post("/unfollowTopic", authenticateToken, async (req, res) => {
  const symbol = req.body.symbol;
  const userId = req.user.userId;

  const sql = "DELETE FROM follows_topic WHERE `symbol` = ? AND userId = ?";
  await query(sql, [symbol, userId]);
  res.json({ success: true, message: "Topic unfollowed" });
});

//get followed topics
app.get("/getFollowedTopics", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const sql = `
    SELECT topics.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) as view_count,
           (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) as like_count,
           (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) as comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    WHERE topics.topic_id IN (SELECT topic_id FROM follows_topic WHERE userId = ?)`;
  try {
    let topics = await query(sql, [userId]);

    // Here you would loop through the topics and for each one query the likes
    for (let topic of topics) {
      const likesSql = `
        SELECT users.userId, users.name, users.image as avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id = ?`;
      let likes = await query(likesSql, [topic.topic_id]);
      topic.likes = likes;
    }

    res.json({ success: true, topics });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching followed topics" });
  }
});

app.get("/getTopicsAll", async (req, res) => {
  const { page = 1, pageSize = 10, sortLike = "newest" } = req.query;
  const offset = (page - 1) * pageSize;

  // Thiết lập ORDER BY
  let orderByClause = "topics.created_at DESC";
  if (sortLike === "more-interaction") {
    orderByClause = `
      (SELECT COUNT(*) FROM likes_topic   WHERE likes_topic.topic_id   = topics.topic_id) +
      (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) +
      (SELECT COUNT(*) FROM views_topic    WHERE views_topic.topic_id    = topics.topic_id)
      DESC
    `;
  }

  const topicsSql = `
    SELECT 
      topics.*,
      users.name   AS author,
      users.image  AS avatar,
      (SELECT COUNT(*) FROM views_topic    WHERE views_topic.topic_id    = topics.topic_id) AS view_count,
      (SELECT COUNT(*) FROM likes_topic    WHERE likes_topic.topic_id    = topics.topic_id) AS like_count,
      (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) AS comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  try {
    // 1) Lấy page
    let topics = await query(topicsSql, [parseInt(pageSize, 10), parseInt(offset, 10)]);

    // 2) Parse trường image thành mảng
    topics = topics.map(topic => {
      let imgs = [];
      if (topic.image) {
        // nếu MySQL trả về JSON object thì dùng luôn, nếu là string thì parse
        imgs = typeof topic.image === "string"
          ? JSON.parse(topic.image)
          : topic.image;
      }
      return { ...topic, image: imgs };
    });

    // 3) Lấy likes cho tất cả topic trong một query (đỡ N lần gọi)
    const topicIds = topics.map(t => t.topic_id);
    let likesMap = {};
    if (topicIds.length) {
      const likesSql = `
        SELECT 
          likes_topic.topic_id,
          users.userId,
          users.name,
          users.image AS avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id IN (?)
      `;
      const allLikes = await query(likesSql, [topicIds]);
      // gom nhóm theo topic_id
      allLikes.forEach(l => {
        likesMap[l.topic_id] ??= [];
        likesMap[l.topic_id].push({
          userId: l.userId,
          name: l.name,
          avatar: l.avatar
        });
      });
    }

    // 4) Gán likes vào từng topic
    topics = topics.map(t => ({
      ...t,
      likes: likesMap[t.topic_id] || []
    }));

    // 5) Lấy tổng số topic
    const totalResult = await query("SELECT COUNT(*) AS total FROM topics");
    const totalTopics = totalResult[0].total || 0;

    return res.json({
      success: true,
      topics,
      totalTopics,
      currentPage: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


//get list topic of specific user
app.get("/getTopicsByUser/:userId", async (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT topics.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) as view_count,
           (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) as like_count,
           (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) as comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    WHERE topics.userId = ?`;
  try {
    let topics = await query(sql, [userId]);

    // Here you would loop through the topics and for each one query the likes
    for (let topic of topics) {
      const likesSql = `
        SELECT users.userId, users.name, users.image as avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id = ?`;
      let likes = await query(likesSql, [topic.topic_id]);
      topic.likes = likes;
    }

    res.json({ success: true, topics });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching user topics" });
  }
});

app.get("/financial-reports/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  const reportsDirectory = path.join(__dirname, "bctc", symbol);

  fs.readdir(reportsDirectory, (err, files) => {
    if (err) {
      console.log("Unable to scan directory: " + err);
      return res.status(200).send({
        error: "Failed to read directory",
        details: err.message,
        data: [],
      });
    }

    // Lọc và trả về chỉ các file PDF
    const pdfFiles = files
      .filter((file) => file.endsWith(".pdf"))
      .map((file, index) => {
        // Giả định tên file bắt đầu bằng năm theo định dạng YYYY...
        const year = file.slice(0, 4); // Lấy bốn ký tự đầu tiên từ tên file
        return {
          id: index,
          title: file,
          lengthReport: 1,
          organCode: symbol,
          sourceUrl: `http://${req.headers.host}/bctc/${symbol}/${file}`, // Adjust this URL based on your actual file access path
          yearReport: year, // Thêm trường year vào mỗi object
        };
      });

    res.json({ error: false, data: pdfFiles, message: "reports list." });
  });
});

app.post("/createTopic", authenticateToken, async (req, res) => {
  let { title, image, symbol_name, description, userId, recommendation, price } = req.body;

  // Lấy thông tin của các công ty và danh sách theo dõi của người dùng
  let data = await query("SELECT * FROM info_company");
  let dataFollow = await query("SELECT * FROM follows_topic WHERE userId = ?", [userId]);

  // Kiểm tra các trường bắt buộc
  if (!title || !symbol_name || !description || !userId) {
    return res.status(400).send({ error: true, message: "Bạn phải nhập đầy đủ nội dung!" });
  }

  // Kiểm tra xem người dùng đã follow công ty (dựa trên symbol_name) hay chưa
  const isFollowing = dataFollow.some(follow => follow.symbol === symbol_name);
  if (!isFollowing) {
    return res.status(400).send({ error: true, message: `Bạn phải tham gia group ${symbol_name} mới có thể đăng bài!` });
  }

  // Chỉ chấp nhận các giá trị hợp lệ cho recommendation
  const validRecommendations = ["BUY", "SELL", null, undefined];
  if (!validRecommendations.includes(recommendation)) {
    return res.status(400).send({ error: true, message: "Invalid recommendation value" });
  }

  // Lấy bài đăng gần nhất của user với symbol_name này
  const existingPosts = await query(
    "SELECT recommendation, price FROM topics WHERE symbol_name = ? AND userId = ? ORDER BY created_at DESC LIMIT 1",
    [symbol_name, userId]
  );

  let lastRecommendation = existingPosts.length > 0 ? existingPosts[0].recommendation : null;
  let lastPrice = existingPosts.length > 0 ? parseFloat(existingPosts[0].price) : null;

  // Kiểm tra logic đăng bài
  if (!lastRecommendation) {
    if (recommendation !== "BUY" && recommendation !== null) {
      return res.status(400).send({ error: true, message: "Lần đầu chỉ được khuyến nghị mua hoặc không khuyến nghị" });
    }
  } else if (lastRecommendation === "BUY") {
    if (recommendation !== "SELL" && recommendation !== null) {
      return res.status(400).send({ error: true, message: "Sau khi mua chỉ được khuyến nghị bán hoặc không khuyến nghị" });
    }
  } else if (lastRecommendation === "SELL") {
    if (recommendation !== "BUY" && recommendation !== null) {
      return res.status(400).send({ error: true, message: "Sau khi bán thì chỉ được khuyến nghị mua hoặc không khuyến nghị" });
    }
  }

  let profitLossPercentage = null;

  // Nếu bài đăng mới là SELL và có bài BUY trước đó thì tính % lợi nhuận/lỗ
  if (recommendation === "SELL" && lastRecommendation === "BUY" && lastPrice) {
    profitLossPercentage = ((price - lastPrice) / lastPrice) * 100;
  }
  const imagesArray = Array.isArray(image)
    ? image
    : image ? [image]
      : [];


  const imageJson = JSON.stringify(imagesArray);
  // Lưu bài viết vào database
  await query(
    "INSERT INTO topics (title, image, symbol_name, description, userId, created_at, recommendation, price, profit_loss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      title,
      imageJson,
      symbol_name,
      description,
      userId,
      moment().format("YYYY-MM-DD HH:mm:ss"),
      recommendation || null, // Nếu không có khuyến nghị thì lưu NULL
      price,
      profitLossPercentage // Lưu % lợi nhuận/lỗ vào database (nếu có)
    ]
  );

  res.send({
    error: false,
    message: "New topic created successfully",
    profitLossPercentage: profitLossPercentage !== null ? `${profitLossPercentage.toFixed(2)}%` : "N/A"
  });
});


app.get("/topics/leaderboard", async (req, res) => {
  try {
    // Truy vấn lấy tất cả các dòng dữ liệu (mỗi dòng ứng với 1 stock của user)
    const rows = await query(
      `SELECT 
          u.image AS avatar, 
          u.name,
          u.userId, 
          t.symbol_name AS stock,
          MAX(t.profit_loss) AS highest_profit_loss,
          (
            SELECT created_at 
            FROM topics 
            WHERE userId = t.userId 
              AND symbol_name = t.symbol_name 
              AND recommendation = 'BUY'
            ORDER BY created_at DESC 
            LIMIT 1
          ) AS buy_recommend_date,
          (
            SELECT price 
            FROM topics 
            WHERE userId = t.userId 
              AND symbol_name = t.symbol_name 
              AND recommendation = 'BUY'
            ORDER BY created_at DESC 
            LIMIT 1
          ) AS buy_recommend_price,
          (
            SELECT COUNT(*) 
            FROM topics 
            WHERE userId = t.userId 
              AND symbol_name = t.symbol_name 
              AND recommendation = 'BUY'
          ) AS buy_count
        FROM topics t
        JOIN users u ON t.userId = u.userId
        WHERE t.profit_loss IS NOT NULL
        GROUP BY t.userId, t.symbol_name
        ORDER BY highest_profit_loss DESC`
    );

    // Nhóm dữ liệu theo userId để tạo cấu trúc cấp đầu tiên là user
    // và cấp thứ 2 là mảng khuyến nghị của user đó.
    const leaderboardGrouped = rows.reduce((acc, row) => {
      const userId = row.userId;
      if (!acc[userId]) {
        acc[userId] = {
          avatar: row.avatar,
          name: row.name,
          userId: row.userId,
          recommendations: []
        };
      }
      acc[userId].recommendations.push({
        stock: row.stock,
        highest_profit_loss: row.highest_profit_loss,
        buy_recommend_date: row.buy_recommend_date,
        buy_recommend_price: row.buy_recommend_price,
        buy_count: row.buy_count
      });
      return acc;
    }, {});

    // Chuyển đổi đối tượng kết quả sang mảng
    const leaderboard = Object.values(leaderboardGrouped);

    res.status(200).send({
      error: false,
      leaderboard
    });
  } catch (error) {
    console.error("Error fetching leaderboard: ", error);
    res.status(500).send({
      error: true,
      message: "Có lỗi xảy ra khi truy vấn dữ liệu leaderboard"
    });
  }
});





// API to record a view for a topic
app.post("/topics/:topic_id/view", authenticateToken, async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);
  const userId = req.user.userId;

  const sql = "INSERT INTO views_topic (topic_id, userId) VALUES (?, ?)";
  await query(sql, [topic_id, userId]);

  res.json({ success: true, message: "View recorded" });
});

// API to like a topic
app.post("/topics/:topic_id/like", authenticateToken, async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);
  const userId = req.user.userId;

  const sql = "INSERT INTO likes_topic (topic_id, userId) VALUES (?, ?)";
  await query(sql, [topic_id, userId]);
  res.json({ success: true, message: "Topic liked" });
});

// API to unlike a topic
app.post("/topics/:topic_id/unlike", authenticateToken, async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);
  const userId = req.user.userId;

  const sql = "DELETE FROM likes_topic WHERE topic_id = ? AND userId = ?";
  await query(sql, [topic_id, userId]);
  res.json({ success: true, message: "Topic unliked" });
});

// API to comment on a topic
app.post("/topics/:topic_id/comments", authenticateToken, async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);
  const userId = req.user.userId;
  const { content, parent_id } = req.body; // Include field parent_id

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  const comment = { topic_id, userId, content, parent_id };
  const sql = "INSERT INTO comments_topic SET ?";
  await query(sql, comment);
  res.json({ success: true, message: "Comment created" });
});

// API to get comments for a topic
app.get("/topics/:topic_id/comments", async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);

  const commentsSql = `
    SELECT 
      comments_topic.*, 
      users.name, 
      users.image AS avatar,
      COUNT(likes_comment.id) AS like_count
    FROM 
      comments_topic
    JOIN 
      users ON comments_topic.userId = users.userId
    LEFT JOIN 
      likes_comment ON comments_topic.comment_id = likes_comment.comment_id
    WHERE 
      comments_topic.topic_id = ?
    GROUP BY 
      comments_topic.comment_id
    ORDER BY 
      comments_topic.created_at DESC;`;

  const likersSql = `
    SELECT 
      likes_comment.comment_id,
      users.userId,
      users.name,
      users.image AS avatar
    FROM 
      likes_comment
    JOIN 
      users ON likes_comment.userId = users.userId
    WHERE 
      likes_comment.topic_id = ?;`;

  try {
    const comments = await query(commentsSql, [topic_id]);
    const likers = await query(likersSql, [topic_id]);

    // Map likers to their respective comments
    const likersMap = likers.reduce((acc, liker) => {
      if (!acc[liker.comment_id]) acc[liker.comment_id] = [];
      acc[liker.comment_id].push({
        userId: liker.userId,
        name: liker.name,
        avatar: liker.avatar,
      });
      return acc;
    }, {});

    // Attach likers to comments
    const enrichedComments = comments.map((comment) => ({
      ...comment,
      liked_by: likersMap[comment.comment_id] || [],
    }));

    res.json({ success: true, comments: enrichedComments });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching comments" });
  }
});

// API to get likes for a topic
app.get("/topics/:topic_id/likes", async (req, res) => {
  const topic_id = parseInt(req.params.topic_id);
  const sql = `
    SELECT likes_topic.*, users.name, users.image as avatar
    FROM likes_topic
    JOIN users ON likes_topic.userId = users.userId
    WHERE likes_topic.topic_id = ?`;
  try {
    let likes = await query(sql, [topic_id]);
    res.json({ success: true, likes });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching likes" });
  }
});

// config
app.post("/config", function (req, res) {
  let data = req.body.data;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  // let listRuSymbol = data.listsymbol.filter((item) => {
  //   return listConfig.listsymbol.indexOf(item) < 0;
  // });
  // let listOldSymbol = data.listsymbol.filter((item) => {
  //   return listConfig.listsymbol.indexOf(item) > -1;
  // });
  // let listRunInterval = data.listInterval.filter((item) => {
  //   return listConfig.listInterval.indexOf(item) < 0;
  // });
  listConfig = data;
  fs.writeFileSync("listConfig.json", JSON.stringify(data));
  // if (listRunInterval.length > 0) {
  //   run(listOldSymbol, listRunInterval, true);
  // }
  // if (listRuSymbol.length > 0) {
  //   run(listRuSymbol, data.listInterval, true);
  // }

  let curTime = new Date();
  //   ${JSON.stringify(listConfig)}
  //   ${moment(curTime).format("HH:mm:ss")}`);
  const { listPair, ...dataSend } = data;
  for (let i = 0; i < chat_id.length; i++) {
    bot.sendMessage(
      chat_id[i],
      `Config changed:
    ${JSON.stringify(dataSend)}`
    );
  }

  console.log(`Config changed:
      ${JSON.stringify(data)}
      ${moment(curTime).add(5, "hours").format("HH:mm:ss")}`);

  return res.send({ error: false, data: data, message: "config list." });
});

app.get("/getConfig", function (req, res) {
  return res.send({ error: false, data: listConfig, message: "config list." });
});

app.post("/users/createConfig", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming authenticateToken middleware sets req.user
  const userData = req.body;
  // Implement logic to save userData for the userId

  res.status(201).send({ message: "User data created successfully." });
});

app.put("/users/updateConfig", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Using authenticated user's ID
  const updatedData = req.body;
  // Implement logic to update user data for the userId
  res.send({ message: "User data updated successfully." });
});

app.delete("/users/deleteConfig", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Using authenticated user's ID
  // Implement logic to delete user data for the userId
  res.send({ message: "User data deleted successfully." });
});

//get all info_company
app.get("/info-company", async function (req, res) {
  let data = await query("SELECT * FROM info_company");
  let mapData = data.map((item, index) => {
    return {
      ...item,
      image: `https://cdn02.wigroup.vn/logo_company/${item?.symbol}.jpeg`,
    };
  });
  res.send({ error: false, data: mapData, message: "config list." });
});

//get all info_company
app.get("/info-company-follow", authenticateToken, async function (req, res) {
  const userId = req.user.userId; // Assuming authenticateToken middleware sets req.user
  let data = await query("SELECT * FROM info_company");
  let dataFollow = await query("SELECT * FROM follows_topic WHERE userId = ?", [
    userId,
  ]);
  let dataMap = data?.map((item, index) => {
    return {
      ...item,
      image: `https://cdn02.wigroup.vn/logo_company/${item?.symbol}.jpeg`,
      isFollow: dataFollow.find((itemFollow) => {
        return itemFollow.symbol === item.symbol;
      })
        ? true
        : false,
    };
  });
  res.send({ error: false, data: dataMap, message: "config list." });
});

app.get("/users/getConfig", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming authenticateToken middleware sets req.user
  // Implement logic to fetch configuration data for the userId
  try {
    // Example query to fetch user config from a database
    const userConfig = await query(
      "SELECT config FROM user_configs WHERE userId = ?",
      [userId]
    );
    if (userConfig.length > 0) {
      res.send({ success: true, config: userConfig[0].config });
    } else {
      res
        .status(404)
        .send({ success: false, message: "Configuration not found." });
    }
  } catch (error) {
    console.error("Failed to fetch user config:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

//get top20
app.get("/top20/:type", async function (req, res) {
  let type = req.params.type;
  let data = await query(`SELECT * FROM top20_${type}`);
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  if (hours < 9 && hours > 8) {
    data = data?.map((item, index) => {
      return {
        symbol: "",
        point: 0,
      };
    });
  }
  res.send({ error: false, data: data, message: "config list." });
});

//get change_count
app.get("/change_count/:type", async function (req, res) {
  let type = req.params.type;
  let data = await query("SELECT * FROM change_count where `index` = ?", [
    type,
  ]);
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  if (hours < 9 && hours > 7) {
    data =
      type === "VNINDEX"
        ? [
          {
            index: "VNINDEX",
            noChange: 0,
            decline: 0,
            advance: 0,
            time: "14:45:08",
          },
        ]
        : [
          {
            index: "HNX",
            noChange: 0,
            decline: 0,
            advance: 0,
            time: "14:45:08",
          },
        ];
  }
  res.send({ error: false, data: data, message: "config list." });
});

//get nuoc_ngoai
app.get("/nuoc_ngoai", async function (req, res) {
  let data = await query("SELECT * FROM nuoc_ngoai");
  res.send({ error: false, data: data, message: "config list." });
});

//get nuoc_ngoai_all
app.get("/nuoc_ngoai_all", async function (req, res) {
  let data = await query("SELECT * FROM nuoc_ngoai_all");
  res.send({ error: false, data: data, message: "config list." });
});

//get tu_doanh
app.get("/tu_doanh", async function (req, res) {
  let data = await query("SELECT * from tu_doanh");
  res.send({ error: false, data: data, message: "success" });
});

//get symbol_vol
app.get("/symbol_vol", async function (req, res) {
  let data = await query("SELECT * FROM symbol_vol");
  res.send({ error: false, data: data, message: "config list." });
});
//get tu_doanh_all
app.get("/tu_doanh_all", async function (req, res) {
  let data = await query("SELECT * FROM tu_doanh_all");
  res.send({ error: false, data: data, message: "config list." });
});

//get all statistics include online number and total number and number of group and number of post
app.get("/statistics", async function (req, res) {
  let onlineCount = await query(
    "SELECT COUNT(*) as onlineCount FROM users WHERE isOnline = 1"
  );
  let totalCount = await query("SELECT COUNT(*) as totalCount FROM users");
  //select count distinc symbol_name from topics
  let groupCount = await query(
    "SELECT COUNT(DISTINCT symbol_name) as groupCount FROM topics"
  );
  let postCount = await query("SELECT COUNT(*) as postCount FROM topics");
  let data = {
    onlineCount: onlineCount[0].onlineCount,
    totalCount: totalCount[0].totalCount,
    groupCount: groupCount[0].groupCount,
    postCount: postCount[0].postCount,
  };
  res.send({ error: false, data: data, message: "config list." });
});

//get thanh_khoan_historyy
app.get("/thanh_khoan_history/:type", async function (req, res) {
  let type = req.params.type;
  let data = await query(`SELECT * FROM thanh_khoan_history_${type}`);
  res.send({ error: false, data: data, message: "config list." });
});

//get thanh_khoan
app.get("/thanh_khoan/:type", async function (req, res) {
  let type = req.params.type;
  let data = await query(`SELECT * FROM thanh_khoan_${type}`);
  res.send({ error: false, data: data, message: "config list." });
});

app.post("/quan_tri_von", async function (req, res) {
  let data = req.body.data;
  data = data.map((item) => [item]);
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  await query("INSERT INTO quan_tri_von (symbol) VALUES ?", [data]);
  res.send({ error: false, data: data, message: "Thêm mã thành công" });
});

app.get("/quan_tri_von", async function (req, res) {
  let data = await query("SELECT * FROM quan_tri_von");
  let rows = await query("SELECT * from data");
  let mapData = data.map((item, index) => {
    let itemRealtime = rows.find((itemRealtime) => {
      return itemRealtime.symbol === item.symbol;
    });
    return {
      ...item,
      id: index,
      key: item.id,
      stt: index + 1,
      price: itemRealtime ? itemRealtime.close : "",
      volume: itemRealtime ? itemRealtime.volume : "",
    };
  });
  res.send({ error: false, data: mapData, message: "config list." });
});

app.post("/register", async (req, res) => {
  try {
    const { email, name, password, phone_number } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO users (email, name, password, phone_number, createdOn, isOnline) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, phone_number, new Date(), 0]
    );
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/register-otp", async (req, res) => {
  try {
    const { email, name, password, phone_number, otp } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO users (email, name, password, phone_number, createdOn, isOnline) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, phone_number, new Date(), 0]
    );
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/send-code-sms", async (req, res) => {
  const { phoneNumber } = req.body;
  let passcode = randomize("0", 6);
  const formattedPhoneNumber = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+84${phoneNumber.replace(/^0/, "")}`;

  console.log("Formatted phone number: ", formattedPhoneNumber);

  // Gửi SMS qua Twilio
  const client = twilio(accountSid, authToken);

  client.verify.v2
    .services("VA3b627f49f233289c812d533f3a644140")
    .verifications.create({
      body: `Mã đổi mật khẩu của bạn là: ${passcode}`,
      from: "DAUTUBENVUNG",
      to: formattedPhoneNumber,
      channel: "sms",
    })
    .then((message) => {
      console.log("SMS sent: " + message.sid);
      res
        .status(200)
        .json({ message: "Passcode sent successfully via SMS", passcode });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Failed to send passcode via SMS" });
    });
});

app.post("/forgot-password", (req, res) => {
  const { email, phoneNumber } = req.body;
  let passcode = randomize("0", 6);
  console.log("passcode: ", passcode);

  if (phoneNumber) {
    const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+84${phoneNumber.replace(/^0/, "")}`;

    console.log("Formatted phone number: ", formattedPhoneNumber);

    // Gửi SMS qua Twilio
    const client = twilio(accountSid, authToken);

    client.verify.v2
      .services("VA3b627f49f233289c812d533f3a644140")
      .verifications.create({
        body: `Mã đổi mật khẩu của bạn là: ${passcode}`,
        from: "DAUTUBENVUNG",
        to: formattedPhoneNumber,
        channel: "sms",
      })
      .then((message) => {
        console.log("SMS sent: " + message.sid);
        res
          .status(200)
          .json({ message: "Passcode sent successfully via SMS", passcode });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ message: "Failed to send passcode via SMS" });
      });
  } else if (email) {
    // Gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailConfig,
        pass: passwordConfig,
      },
    });
    const mailOptions = {
      from: `Đầu Tư Bền Vững ${emailConfig}`,
      to: email,
      subject: "Yêu cầu đổi mật khẩu",
      text: `Mã đổi mật khẩu của bạn là: ${passcode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to send passcode via email" });
      } else {
        console.log("Email sent: " + info.response);
        res
          .status(200)
          .json({ message: "Passcode sent successfully", passcode });
      }
    });
  } else {
    res.status(400).json({ message: "No contact info provided" });
  }
});

// app.post("/change-password-contact", async (req, res) => {
//   const { contact, password } = req.body;
//   const password_hash = await bcrypt.hash(password, 10);

//   let response;
//   if (validateEmail(contact)) {
//     response = await query("UPDATE users SET password = ? WHERE email = ?", [
//       password_hash,
//       contact,
//     ]);
//   } else if (validatePhoneNumber(contact)) {
//     response = await query(
//       "UPDATE users SET password = ? WHERE phone_number = ?",
//       [password_hash, contact]
//     );
//   } else {
//     return res.status(400).send("Invalid contact information");
//   }

//   if (!response) {
//     return res.status(500).send("Failed to update password");
//   }
//   return res.status(200).json({ message: "Đổi pass thành công!" });
// });

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+?[0-9]{10,15}$/; // Adjust the regex to match your phone number format
  return phoneRegex.test(phoneNumber);
}

app.post("/change-password", async (req, res) => {
  const { userID, currentPassword, newPassword } = req.body;
  console.log("userID: ", userID);

  // Ensure all required fields are provided
  if (!userID || !currentPassword || !newPassword) {
    return res.status(400).send({
      error: "UserID, current password, and new password are required.",
    });
  }

  // Query the database for user by userID
  let results = await query("SELECT * FROM users WHERE userID = ?", [userID]);
  console.log("results: ", results);

  if (results.length === 0) {
    return res.status(401).send({ error: "User not found" });
  }

  let user = results[0];

  // Verify the current password with bcrypt
  let isCorrectPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isCorrectPassword) {
    return res.status(401).send({ error: "Incorrect current password" });
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update the password in the database
  let updateResponse = await query(
    "UPDATE users SET password = ? WHERE userID = ?",
    [newPasswordHash, userID]
  );

  // Check if the update was successful
  if (!updateResponse.affectedRows) {
    return res.status(500).send("Failed to update password");
  }

  // Return success response
  return res.status(200).json({ message: "Password updated successfully!" });
});

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' can be either email or phone_number

  try {
    let results = await query(
      "SELECT * FROM users WHERE email = ? OR phone_number = ?",
      [identifier, identifier]
    );
    if (results.length === 0) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    let user = results[0];
    let isCorrectPassword = await bcrypt.compare(password, user.password || "");

    if (!isCorrectPassword) {
      return res.status(401).send({ error: "Wrong password" });
    }

    // Update isOnline status
    await query("UPDATE users SET isOnline = 1 WHERE userID = ?", [
      user.userID,
    ]);

    // Generate a token
    const token = jwt.sign({ userId: user.userID }, process.env.SECRET, {
      expiresIn: "24h",
    });

    res.send({ message: "Login successful", token });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(error);
    // Return a generic error message to the client
    res.status(500).send({ error: "An error occurred during login" });
  }
});

app.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Assuming 'authenticateToken' middleware extracts and sets `req.user`
    await query("UPDATE users SET isOnline = 0 WHERE userID = ?", [
      req.user.userId,
    ]);

    // Optionally add any logging or additional functionality here

    res.send({ message: "Logout successful" });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// getUserInfo endpoint
app.get("/getUserInfo", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Extracted from the token

  try {
    let userResult = await query(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline, birthdate FROM users WHERE userID = ?",
      [userId]
    );
    if (userResult.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    let followersResult = await query(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [userId]
    );

    let userInfo = userResult[0];
    userInfo.followerCount = followersResult[0].followerCount;

    res.send(userInfo);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.put("/update-user", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { image, birthdate } = req.body;

  // Validate birthdate
  const validDate = moment(birthdate, "YYYY-MM-DD", true).isValid(); // Strict parsing to ensure format
  if (!validDate) {
    return res.status(400).send({ error: "Invalid birthdate format" });
  }

  try {
    const userExists = await query("SELECT 1 FROM users WHERE userID = ?", [
      userId,
    ]);
    if (userExists.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    // Proceed with update if date is valid
    await query(`UPDATE users SET image = ?, birthdate = ? WHERE userID = ?`, [
      image,
      birthdate,
      userId,
    ]);

    const updatedUserResult = await query(
      "SELECT userID, email, phone_number, name, createdOn, image, birthdate, isOnline FROM users WHERE userID = ?",
      [userId]
    );

    let userInfo = updatedUserResult[0];
    let followersResult = await query(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [userId]
    );
    userInfo.followerCount = followersResult[0].followerCount;

    res.send(userInfo);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/getUserDetail/:userId", authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId; // The user whose details are being fetched
  const currentUserId = req.user ? req.user.userId : null; // The authenticated user

  try {
    // Fetch user details
    let userResult = await query(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline FROM users WHERE userID = ?",
      [targetUserId]
    );

    if (userResult.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    let userInfo = userResult[0];

    // Fetch follower count
    let followersResult = await query(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [targetUserId]
    );
    userInfo.followerCount = followersResult[0].followerCount;

    // Initialize status as 'not' by default
    let status = "not";

    let selectAll;
    if (currentUserId) {
      selectAll = await query(
        "SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user2_id = ? AND user1_id = ?)",
        [+currentUserId, +targetUserId, +currentUserId, +targetUserId]
      );
      // Check if there is a friendship record where currentUserId sent a request to targetUserId
      let sentRequest = await query(
        "SELECT status FROM friendships WHERE user1_id = ? AND user2_id = ?",
        [+currentUserId, +targetUserId]
      );

      // Check if there is a friendship record where targetUserId sent a request to currentUserId
      let receivedRequest = await query(
        "SELECT status FROM friendships WHERE user1_id = ? AND user2_id = ?",
        [+targetUserId, +currentUserId]
      );

      if (sentRequest.length > 0) {
        if (sentRequest[0].status === "requested") {
          status = "pending"; // Người dùng hiện tại đã gửi lời mời kết bạn
        } else if (sentRequest[0].status === "accepted") {
          status = "acceptFriend"; // Hai người đã là bạn (trước đây là "done")
        }
      } else if (receivedRequest.length > 0) {
        if (receivedRequest[0].status === "requested") {
          status = "pending"; // Người kia đã gửi lời mời kết bạn
        } else if (receivedRequest[0].status === "accepted") {
          status = "acceptFriend"; // Hai người đã là bạn (trước đây là "done")
        }
      }
    }

    // Add the status to the userInfo
    userInfo.status = status;
    if (selectAll.length > 0) userInfo.sender_id = selectAll[0].user1_id;
    console.log("selectAll: ", selectAll);
    console.log("userInfo: ", userInfo);
    res.send(userInfo);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/addFriend", authenticateToken, async (req, res) => {
  const friendId = req.body.friendId;
  const userId = req.user.userId; // Extracted from JWT
  try {
    await query(
      "INSERT INTO friendships (user1_id, user2_id, status, action_user_id) VALUES (?, ?, 'requested', ?)",
      [userId, friendId, userId]
    );

    // Gửi thông báo qua socket đến người nhận nếu online
    const receiverSocketId = userSocketMap[friendId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendNotification", {
        senderId: userId,
        message: "Bạn có lời mời kết bạn mới.",
      });
    }

    res.json({ success: true, message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending friend request",
      error: error.message,
    });
  }
});

// Accept Friend Request - chấp nhận lời mời và gửi thông báo về cho người gửi lời mời
app.post("/acceptFriend", authenticateToken, async (req, res) => {
  const friendId = req.body.friendId;
  const userId = req.user.userId; // Extracted from JWT
  try {
    await query(
      "UPDATE friendships SET status = 'accepted', action_user_id = ? WHERE user1_id = ? AND user2_id = ? AND status = 'requested'",
      [userId, friendId, userId]
    );

    // Tự động theo dõi lẫn nhau
    await query(
      "INSERT INTO user_followers (follower_id, following_id) VALUES (?, ?), (?, ?)",
      [userId, friendId, friendId, userId]
    );

    // Gửi thông báo qua socket cho người gửi lời mời nếu online
    const senderSocketId = userSocketMap[friendId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("friendResponseNotification", {
        senderId: userId,
        response: "accepted",
        message: "Lời mời kết bạn của bạn đã được chấp nhận.",
      });
    }

    res.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error accepting friend request",
      error: error.message,
    });
  }
});

// Reject Friend Request - từ chối lời mời và gửi thông báo về cho người gửi lời mời
app.post("/rejectFriend", authenticateToken, async (req, res) => {
  const friendId = req.body.friendId;
  const userId = req.user.userId; // Extracted from JWT
  try {
    await query(
      "DELETE FROM friendships WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)) AND status = 'requested'",
      [userId, friendId, friendId, userId]
    );

    // Gửi thông báo qua socket cho người gửi lời mời nếu online
    const senderSocketId = userSocketMap[friendId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("friendResponseNotification", {
        senderId: userId,
        response: "rejected",
        message: "Lời mời kết bạn của bạn đã bị từ chối.",
      });
    }

    res.json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting friend request",
      error: error.message,
    });
  }
});

app.get("/getFriends", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Extracted from JWT
  try {
    // Truy vấn này kết hợp thông tin từ bảng `users` và `friendships`
    // để lấy ra thông tin chi tiết về bạn bè
    const queryString = `
          SELECT 
              u.userId, 
              u.name, 
              u.image AS avatar,
              u.isOnline
          FROM 
              users u
          JOIN 
              friendships f ON f.user1_id = u.userId OR f.user2_id = u.userId
          WHERE 
              (f.user1_id = ? OR f.user2_id = ?) 
              AND f.status = 'accepted' 
              AND u.userId != ?`;

    const friends = await query(queryString, [userId, userId, userId]);

    res.json({ success: true, friends });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving friends",
      error: error.message,
    });
  }
});

// API to create a post
app.post("/posts", authenticateToken, async (req, res) => {
  const { title, content, image_url } = req.body;
  const userId = req.user.userId; // This would come from the JWT token after decoding

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  const post = { userId, title, content, image_url };
  const sql = "INSERT INTO posts SET ?";
  await query(sql, post);
  res.json({ success: true, message: "Post created" });
});

// API to get all posts
// app.get("/posts", authenticateToken, async (req, res) => {
//   const sql = `
//     SELECT posts.*, users.name as author, users.image as avatar,
//            (SELECT COUNT(*) FROM views WHERE views.post_id = posts.post_id) as view_count,
//            (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.post_id) as like_count,
//            (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.post_id) as comment_count
//     FROM posts
//     JOIN users ON posts.userId = users.userId`;
//   let posts = await query(sql);
//   res.json({ success: true, posts });
// });

app.get("/posts", authenticateToken, async (req, res) => {
  const postsSql = `
    SELECT posts.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views WHERE views.post_id = posts.post_id) as view_count,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.post_id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.post_id) as comment_count
    FROM posts
    JOIN users ON posts.userId = users.userId`;
  try {
    let posts = await query(postsSql);

    // Here you would loop through the posts and for each one query the likes
    for (let post of posts) {
      const likesSql = `
        SELECT users.userId, users.name, users.image as avatar
        FROM likes
        JOIN users ON likes.userId = users.userId
        WHERE likes.post_id = ?`;
      let likes = await query(likesSql, [post.post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching posts" });
  }
});

// API to record a view for a post
app.post("/posts/:post_id/view", authenticateToken, async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const userId = req.user.userId;

  // Thêm dữ liệu vào bảng 'views'
  const sql = "INSERT INTO views (post_id, userId) VALUES (?, ?)";
  await query(sql, [post_id, userId]);

  res.json({ success: true, message: "View recorded" });
});

// API to like a post
app.post("/posts/:post_id/like", authenticateToken, async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const userId = req.user.userId;

  const sql = "INSERT INTO likes (post_id, userId) VALUES (?, ?)";
  await query(sql, [post_id, userId]);
  res.json({ success: true, message: "Post liked" });
});

//API to unlike a post
app.post("/posts/:post_id/unlike", authenticateToken, async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const userId = req.user.userId;

  const sql = "DELETE FROM likes WHERE post_id = ? AND userId = ?";

  await query(sql, [post_id, userId]);
  res.json({ success: true, message: "Post unliked" });
});

// API to comment on a post
app.post("/posts/:post_id/comments", authenticateToken, async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const userId = req.user.userId;
  const { content, parent_id } = req.body; // Thêm trường parent_id

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  const comment = { post_id, userId, content, parent_id };
  const sql = "INSERT INTO comments SET ?";
  await query(sql, comment);
  res.json({ success: true, message: "Comment created" });
});

// API to get comments for a post
app.get("/posts/:post_id/comments", async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const sql = `
    SELECT comments.*, users.name, users.image as avatar
    FROM comments
    JOIN users ON comments.userId = users.userId
    WHERE comments.post_id = ?`;
  try {
    let comments = await query(sql, [post_id]);
    res.json({ success: true, comments });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching comments" });
  }
});

// API to get likes for a post
app.get("/posts/:post_id/likes", async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const sql = `
    SELECT likes.*, users.name, users.image as avatar
    FROM likes
    JOIN users ON likes.userId = users.userId
    WHERE likes.post_id = ?`;
  try {
    let likes = await query(sql, [post_id]);
    res.json({ success: true, likes });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching likes" });
  }
});

//DIỄN ĐÀN
//Tạo Diễn Đàn
app.post("/forums", authenticateToken, async (req, res) => {
  const { name, image_url, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" });
  }
  const forum = { name, image_url, description };
  const sql = "INSERT INTO forums SET ?";
  await query(sql, forum);
  res.json({ success: true, message: "Forum created" });
});

//Lấy Danh Sách Tất Cả Diễn Đàn
app.get("/forums", async (req, res) => {
  const sql = `
    SELECT f.forum_id, f.name, f.image_url, f.description, 
           (SELECT COUNT(*) FROM forum_posts WHERE forum_id = f.forum_id) as post_count
    FROM forums f`;

  try {
    let forums = await query(sql);
    res.json({ success: true, forums });
  } catch (error) {
    console.error("Error fetching forums: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//Tạo Bài Viết Trong Diễn Đàn
app.post("/forums/:forum_id/posts", authenticateToken, async (req, res) => {
  const forum_id = parseInt(req.params.forum_id);
  const { title, content, image_url } = req.body;
  const userId = req.user.userId;
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  const forumPost = { forum_id, userId, title, content, image_url };
  const forumPostSql = "INSERT INTO forum_posts SET ?";
  await query(forumPostSql, forumPost);

  res.json({ success: true, message: "Forum post created" });
});

//Lấy Danh Sách Bài Viết Trong Diễn Đàn
app.get("/forums/:forum_id/posts", async (req, res) => {
  const forum_id = parseInt(req.params.forum_id);

  const sql = `
    SELECT fp.forum_post_id, fp.title, fp.content, fp.image_url, fp.created_at, fp.updated_at, 
           u.name as author, u.image,
           (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
           (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
           (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId
    WHERE fp.forum_id = ?`;

  try {
    let posts = await query(sql, [forum_id]);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
        SELECT u.userId, u.name, u.image
        FROM forum_post_likes fpl
        JOIN users u ON fpl.userId = u.userId
        WHERE fpl.post_id = ?`;
      let likes = await query(likesSql, [post.forum_post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching forum posts: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//API để Ghi Nhận Lượt Xem cho Bài Viết Diễn Đàn
app.post(
  "/forums/:forum_id/posts/:post_id/view",
  authenticateToken,
  async (req, res) => {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO forum_post_views (post_id, userId) VALUES (?, ?)";
    await query(sql, [post_id, userId]);

    res.json({ success: true, message: "View recorded" });
  }
);

//API để Thích Bài Viết Diễn Đàn
app.post(
  "/forums/:forum_id/posts/:post_id/like",
  authenticateToken,
  async (req, res) => {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO forum_post_likes (post_id, userId) VALUES (?, ?)";
    await query(sql, [post_id, userId]);
    res.json({ success: true, message: "Post liked" });
  }
);

//API để Bình Luận Bài Viết Diễn Đàn
// API to comment on a forum post
app.post(
  "/forums/:forum_id/posts/:post_id/comments",
  authenticateToken,
  async (req, res) => {
    const forum_id = parseInt(req.params.forum_id);
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;
    const { content, parent_id } = req.body; // Nhận trường parent_id

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = { post_id, userId, content, parent_id };
    const sql = "INSERT INTO forum_post_comments SET ?";
    await query(sql, comment);
    res.json({ success: true, message: "Comment created" });
  }
);

app.post(
  "/comments/:topic_id/:comment_id/like",
  authenticateToken,
  async (req, res) => {
    const comment_id = parseInt(req.params.comment_id);

    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user ? req.user.userId : null;

    const sql =
      "INSERT INTO likes_comment (comment_id, topic_id, userId) VALUES (?, ?, ?)";
    await query(sql, [comment_id, topic_id, userId]);
    res.json({ success: true, message: "Comment liked" });
  }
);

app.post(
  "/comments/:topic_id/:comment_id/unlike",
  authenticateToken,
  async (req, res) => {
    const topic_id = parseInt(req.params.topic_id);
    const comment_id = parseInt(req.params.comment_id);
    const userId = req.user ? req.user.userId : null;

    const sql = "DELETE FROM likes_comment WHERE comment_id = ? AND userId = ?";
    await query(sql, [comment_id, userId]);
    res.json({ success: true, message: "Comment unliked" });
  }
);

//API để Lấy Bình Luận cho Bài Viết Diễn Đàn
app.get("/forums/posts/:post_id/comments", async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const sql = `
    SELECT c.*, u.name, u.image as avatar
    FROM forum_post_comments c
    JOIN users u ON c.userId = u.userId
    WHERE c.post_id = ?`;
  try {
    let comments = await query(sql, [post_id]);
    res.json({ success: true, comments });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching comments" });
  }
});

//API để Lấy Lượt Thích cho Bài Viết Diễn Đàn
app.get("/forums/posts/:post_id/likes", async (req, res) => {
  const post_id = parseInt(req.params.post_id);
  const sql = `
    SELECT l.*, u.name, u.image as avatar
    FROM forum_post_likes l
    JOIN users u ON l.userId = u.userId
    WHERE l.post_id = ?`;
  try {
    let likes = await query(sql, [post_id]);
    res.json({ success: true, likes });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching likes" });
  }
});

// getUserInfo endpoint
app.get("/user-info", authenticateToken, async (req, res) => {
  const userId = req.query.userId; // Extracted from the token

  try {
    let userResult = await query(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline FROM users WHERE userID = ?",
      [userId]
    );
    if (userResult.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    let followersResult = await query(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [userId]
    );

    let userInfo = userResult[0];
    userInfo.followerCount = followersResult[0].followerCount;

    res.send(userInfo);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/featured-posts", async (req, res) => {
  const sql = `
    SELECT 
      fp.forum_post_id, 
      fp.forum_id, -- Thêm dòng này để lấy forum_id
      fp.title, 
      fp.content, 
      fp.image_url, 
      fp.created_at, 
      fp.updated_at, 
      u.name as author, 
      u.image,
      (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
      (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
      (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId
    ORDER BY view_count DESC
    LIMIT 20`;

  try {
    let posts = await query(sql);
    for (let post of posts) {
      const likesSql = `
        SELECT ul.userId, u.name, u.image as avatar
        FROM forum_post_likes ul
        JOIN users u ON ul.userId = u.userId
        WHERE ul.post_id = ?`;
      let likes = await query(likesSql, [post.forum_post_id]);
      post.likes = likes; // Adding user details to each post
    }
    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching featured posts: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// API to get detailed information of a featured post
app.get("/featured-post-detail/:post_id", async (req, res) => {
  const { post_id } = req.params;

  const sql = `
    SELECT 
      fp.forum_post_id, 
      fp.title, 
      fp.content, 
      fp.image_url, 
      fp.created_at, 
      fp.updated_at, 
      u.name as author, 
      u.image as author_image,
      (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
      (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
      (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId
    WHERE fp.forum_post_id = ?
    LIMIT 1`;

  try {
    const [post] = await query(sql, [post_id]);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Fetch likes details
    const likesSql = `
      SELECT u.userID, u.name, u.image as avatar
      FROM forum_post_likes fpl
      JOIN users u ON fpl.userId = u.userID
      WHERE fpl.post_id = ?`;
    const likes = await query(likesSql, [post_id]);
    post.likes = likes;

    // Fetch comments details
    const commentsSql = `
      SELECT c.comment_id, c.content, c.created_at, u.userID, u.name, u.image as avatar
      FROM forum_post_comments c
      JOIN users u ON c.userId = u.userID
      WHERE c.post_id = ?`;
    const comments = await query(commentsSql, [post_id]);
    post.comments = comments;

    res.json({ success: true, post });
  } catch (error) {
    console.error("Error fetching featured post detail: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//Theo Dõi Diễn Đàn
app.post("/forums/:forum_id/follow", authenticateToken, async (req, res) => {
  const forum_id = parseInt(req.params.forum_id);
  const userId = req.user.userId;

  const follow = { forum_id, userId };
  const sql = "INSERT INTO forum_followers SET ?";
  await query(sql, follow);

  res.json({ success: true, message: "Forum followed" });
});

//Lấy Danh Sách Người Theo Dõi Diễn Đàn
app.get("/forums/:forum_id/followers", async (req, res) => {
  const forum_id = parseInt(req.params.forum_id);

  const sql = `
    SELECT u.userId, u.name, u.image
    FROM forum_followers ff
    JOIN users u ON ff.userId = u.userId
    WHERE ff.forum_id = ?`;

  try {
    let followers = await query(sql, [forum_id]);
    res.json({ success: true, followers });
  } catch (error) {
    console.error("Error fetching forum followers: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Danh sách diễn đàn đang theo dõi
app.get("/forums/following", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const forums = await query(
      "SELECT f.forum_id, f.name, f.image_url, f.description, " +
      "(SELECT COUNT(*) FROM forum_posts WHERE forum_id = f.forum_id) as post_count " +
      "FROM forums f " +
      "JOIN forum_followers ff ON f.forum_id = ff.forum_id " +
      "WHERE ff.userId = ?",
      [userId]
    );
    res.json({ success: true, forums });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Danh sách bài viết của người dùng đang theo dõi
app.get("/posts/following", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const postsSql = `
    SELECT p.*, u.name as author, u.image as avatar, 
           (SELECT COUNT(*) FROM views WHERE views.post_id = p.post_id) as view_count,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = p.post_id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = p.post_id) as comment_count
    FROM posts p
    JOIN users u ON p.userId = u.userId
    WHERE p.userId IN (SELECT following_id FROM user_followers WHERE follower_id = ?)`;

  try {
    let posts = await query(postsSql, [userId]);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
        SELECT u.userId, u.name, u.image as avatar
        FROM likes
        JOIN users u ON likes.userId = u.userId
        WHERE likes.post_id = ?`;
      let likes = await query(likesSql, [post.post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching following users' posts: ", error);
    res.status(500).send({ error: "An error occurred while fetching posts" });
  }
});

// Bỏ theo dõi diễn đàn
app.post("/forums/:forum_id/unfollow", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const forum_id = req.params.forum_id;
  try {
    await query(
      "DELETE FROM forum_followers WHERE forum_id = ? AND userId = ?",
      [forum_id, userId]
    );
    res.json({ success: true, message: "Unfollowed forum successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Danh sách bài viết từ tất cả các diễn đàn
app.get("/forums/posts/all", authenticateToken, async (req, res) => {
  const sql = `
    SELECT fp.forum_post_id, fp.title, fp.content, fp.image_url, fp.created_at, fp.updated_at, 
           u.name as author, u.image,
           (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
           (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
           (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId`;

  try {
    let posts = await query(sql);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
        SELECT u.userId, u.name, u.image
        FROM forum_post_likes fpl
        JOIN users u ON fpl.userId = u.userId
        WHERE fpl.post_id = ?`;
      let likes = await query(likesSql, [post.forum_post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching forum posts: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//FOLLOW USER
//API để Theo Dõi Một Người Dùng:
app.post("/followUser", authenticateToken, async (req, res) => {
  const followerId = req.user.userId;
  const { followingId } = req.body;

  if (!followingId) {
    return res
      .status(400)
      .send({ error: true, message: "Missing followingId" });
  }

  try {
    await query(
      "INSERT INTO user_followers (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );
    res.send({ success: true, message: "User followed successfully" });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API để Hủy Theo Dõi Một Người Dùng:
app.post("/unfollowUser", authenticateToken, async (req, res) => {
  const followerId = req.user.userId;
  const { followingId } = req.body;

  if (!followingId) {
    return res
      .status(400)
      .send({ error: true, message: "Missing followingId" });
  }

  try {
    await query(
      "DELETE FROM user_followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );
    res.send({ success: true, message: "Unfollowed user successfully" });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API để Lấy Danh Sách Người Dùng Đang Theo Dõi/Được Theo Dõi
app.get("/getFollowing", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    let results = await query(
      "SELECT u.userID, u.name, u.email, u.image as avatar FROM user_followers uf JOIN users u ON uf.following_id = u.userID WHERE uf.follower_id = ?",
      [userId]
    );
    res.send({ success: true, following: results });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Lấy danh sách người dùng đang theo dõi người dùng hiện tại
app.get("/getFollowers", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    let results = await query(
      "SELECT u.userID, u.name, u.email, u.image as avatar FROM user_followers uf JOIN users u ON uf.follower_id = u.userID WHERE uf.following_id = ?",
      [userId]
    );
    res.send({ success: true, followers: results });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//MESSAGES
app.get("/getMessages", async (req, res) => {
  try {
    const { receiver_id, group_id } = req.query;
    let messages;
    if (group_id) {
      messages = await query("SELECT * FROM messages WHERE group_id = ?", [
        group_id,
      ]);
    } else {
      messages = await query("SELECT * FROM messages WHERE receiver_id = ?", [
        receiver_id,
      ]);
    }
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving messages",
      error: error.message,
    });
  }
});

app.post("/createGroup", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const creatorUserId = req.user.userId;

    // Tạo nhóm
    const groupResult = await query("INSERT INTO `groups` (name) VALUES (?)", [
      name,
    ]);
    const groupId = groupResult.insertId;

    // Thêm người tạo vào nhóm
    await query("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", [
      groupId,
      creatorUserId,
    ]);

    res.json({
      success: true,
      message: "Group created and creator added as member",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating group or adding creator as member",
      error: error.message,
    });
  }
});

app.post("/addGroupMembers", authenticateToken, async (req, res) => {
  try {
    const { group_id, user_ids } = req.body;

    // Kiểm tra danh sách người dùng
    if (!user_ids || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No user IDs provided",
      });
    }

    // Thêm mỗi người dùng vào nhóm
    for (const user_id of user_ids) {
      await query(
        "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
        [group_id, user_id]
      );
    }

    res.json({ success: true, message: "Members added to group" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding members to group",
      error: error.message,
    });
  }
});

app.post("/removeGroupMember", authenticateToken, async (req, res) => {
  try {
    const { group_id, user_id } = req.body;

    await query(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      [group_id, user_id]
    );

    res.json({ success: true, message: "Member removed from group" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing member from group",
      error: error.message,
    });
  }
});

app.get("/conversations", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  // Fetching group conversations with the latest message or groups without messages
  let groupConversations = await query(
    `SELECT g.id, g.name, g.image_url, 
      (SELECT MAX(m.created_at) FROM messages m WHERE m.group_id = g.id) as last_message_time,
      (SELECT m.content FROM messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
      (SELECT m.is_viewed FROM messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as is_viewed
    FROM \`groups\` g 
    JOIN group_members gm ON g.id = gm.group_id 
    WHERE gm.user_id = ?
    GROUP BY g.id 
    ORDER BY last_message_time DESC, g.id DESC`,
    [userId]
  );

  // Fetching details of group members
  for (let group of groupConversations) {
    const members = await query(
      `SELECT u.userID, u.name, u.image as avatar 
      FROM users u 
      JOIN group_members gm ON u.userID = gm.user_id 
      WHERE gm.group_id = ?`,
      [group.id]
    );
    group.members = members;
  }

  // Fetching direct conversations with the latest message
  let directConversations = await query(
    `SELECT u.userID, u.name, u.image as avatar, MAX(m.created_at) as last_message_time,
    (SELECT m.content FROM messages m WHERE (m.sender_id = u.userID OR m.receiver_id = u.userID) AND m.group_id IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT m.is_viewed FROM messages m WHERE (m.sender_id = u.userID OR m.receiver_id = u.userID) AND m.group_id IS NULL ORDER BY m.created_at DESC LIMIT 1) as is_viewed
    FROM users u 
    JOIN messages m ON (m.sender_id = u.userID OR m.receiver_id = u.userID) 
    WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.group_id IS NULL 
    GROUP BY u.userID 
    ORDER BY last_message_time DESC`,
    [userId, userId]
  );

  res.json({
    success: true,
    conversations: { groups: groupConversations, direct: directConversations },
  });
});
app.post("/startDirectChat", authenticateToken, async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.userId; // Giả sử middleware authenticateToken đã gán req.user

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    // Ví dụ: Lấy thông tin người nhận từ cơ sở dữ liệu
    const userQuery = await query(
      "SELECT userID AS userID, name, image AS avatar FROM users WHERE userID = ?",
      [receiver_id]
    );

    if (!userQuery || userQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }
    const receiver = userQuery[0];

    // Kiểm tra xem đã có cuộc trò chuyện nào chưa (ví dụ: lấy tin nhắn cuối cùng)
    const existingChat = await query(
      `SELECT * FROM messages 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
         AND group_id IS NULL 
       ORDER BY created_at DESC
       LIMIT 1`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    let conversationData;
    if (existingChat && existingChat.length > 0) {
      conversationData = {
        conversation_id: `${sender_id}_${receiver_id}`,
        userID: receiver.userID,
        name: receiver.name,
        avatar: receiver.avatar,
        last_message_time: existingChat[0].created_at,
        last_message_content: existingChat[0].content,
        is_viewed: existingChat[0].is_viewed,
      };

      return res.json({
        success: true,
        message: "Conversation already exists",
        conversation: conversationData,
      });
    } else {
      conversationData = {
        conversation_id: `${sender_id}_${receiver_id}`,
        userID: receiver.userID,
        name: receiver.name,
        avatar: receiver.avatar,
        last_message_time: null,
        last_message_content: "",
        is_viewed: 1,
      };

      return res.json({
        success: true,
        message: "Conversation started but no messages yet",
        conversation: conversationData,
      });
    }
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Error starting conversation",
      error: error.message,
    });
  }
});

app.post("/messages/:message_id/view", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const messageId = req.params.message_id;

  // Cập nhật trạng thái xem tin nhắn
  // Sử dụng Tùy chọn 1 hoặc Tùy chọn 2 ở trên tùy thuộc vào cách thiết kế CSDL của bạn

  // Tùy chọn 1: Cập nhật trực tiếp vào bảng tin nhắn
  await query("UPDATE messages SET is_viewed = true WHERE id = ?", [messageId]);

  // Tùy chọn 2: Thêm bản ghi vào bảng message_views
  // await query("INSERT INTO message_views (message_id, user_id, viewed_at) VALUES (?, ?, NOW())", [messageId, userId]);

  res.json({ success: true, message: "Message view updated" });
});

app.get("/financial-ratio", async (req, res) => {
  let symbol = req.query?.symbol;
  let type = req.query?.type;
  try {
    let financialRatio = await query(
      `SELECT * FROM financial_ratio WHERE organCode = ? and lengthReport ${type === "year" ? ">= 5" : "< 5"
      }`,
      [symbol]
    );
    let financialRatioMap = financialRatio.map((item) => {
      return {
        key: `${item.yearReport}_${item.lengthReport}`,
        value: item,
      };
    });
    res.json({ success: true, items: financialRatioMap });
  } catch (error) {
    res.json({ success: false, data: [] });
  }
});

//Danh sách cổ đông
app.get("/co-dong", async function (req, res) {
  try {
    let symbol = req.query?.symbol;
    let listCoDong = await query("SELECT * FROM co_dong WHERE symbol = ?", [
      symbol,
    ]);

    // let listCoDong = await axios.get(
    //   `https://fwtapi3.fialda.com/api/services/app/StockInfo/GetMajorShareHolders?symbol=${symbol}`
    // );
    // let data = listCoDong?.data?.result;
    res.json({
      success: true,
      listCoDong: listCoDong,
      // listCoDong: data,
    });
  } catch (error) {
    res.json({
      success: false,
      listCoDong: [],
    });
  }
});

//PE ngành
app.get("/pe-nganh", async function (req, res) {
  try {
    // let responsePE = await axios.get(
    //   `https://fwtapi1.fialda.com/api/services/app/Market/GetICBInfos?icbCode=0500,8300,5300,3300,8500,1700,3700,2700,5500,5700,9500,2300,7500,6500,8700,3500,8600,1300,4500`
    // );
    // const dataPE = responsePE?.data?.result;
    res.json({
      success: true,
      data: [],
      // data: dataPE,
    });
  } catch (error) {
    res.json({
      success: false,
      data: [],
    });
  }
  // let responsePE = await axios.get(
  //   `https://fwtapi1.fialda.com/api/services/app/Market/GetICBInfos?icbCode=0500,8300,5300,3300,8500,1700,3700,2700,5500,5700,9500,2300,7500,6500,8700,3500,8600,1300,4500`
  // );
  // const dataPE = responsePE?.data?.result;
  // res.json({
  //   success: true,
  //   data: dataPE,
  // });
});

// API to get macroeconomic data
app.get("/data-vi-mo", async function (req, res) {
  try {
    // You can modify this part to select specific fields or join with other tables if necessary
    let gdpDanhNghia = await query(
      "SELECT * FROM gdp_danh_nghia ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM gdp_danh_nghia WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let gdpThuc = await query(
      "SELECT * FROM gdp_thuc ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM gdp_thuc WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let tongMucBanLeDichVu = await query(
      "SELECT * FROM tong_muc_ban_le_dich_vu ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM tong_muc_ban_le_dich_vu WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let cpi = await query(
      "SELECT * FROM cpi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM cpi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let xuatNhapKhau = await query(
      "SELECT * FROM xuat_nhap_khau ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM xuat_nhap_khau WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let fdi = await query(
      "SELECT * FROM fdi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM fdi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let vonDauTuNganSachNhaNuoc = await query(
      "SELECT * FROM von_dau_tu_ngan_sach_nha_nuoc ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM von_dau_tu_ngan_sach_nha_nuoc WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let khoiLuongSanXuatCongNghiep = await query(
      "SELECT * FROM khoi_luong_san_xuat_cong_nghiep ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM khoi_luong_san_xuat_cong_nghiep WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let pmi = await query(
      "SELECT * FROM pmi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM pmi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let iip = await query(
      "SELECT * FROM iip ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM iip WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );

    res.send({
      code: "SUCCESS",
      message: "Get macroeconomic data successfully",
      data: {
        gdpDanhNghia: {
          gdpDanhNghia: gdpDanhNghia?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.gdp_theo_gia_hien_hanh /
                gdpDanhNghia[index - 4]?.gdp_theo_gia_hien_hanh) *
              100 -
              100,
          })),
          header: [
            "GDP theo giá hiện hành",
            "GDP HH Nông nghiệp, lâm nghiệp và thủy sản",
            "GDP HH Nông nghiệp",
            "GDP HH Lâm nghiệp",
            "GDP HH Thủy sản",
            "GDP HH Công nghiệp và xây dựng",
            "GDP HH Công nghiệp",
            "GDP HH Khai khoáng",
            "GDP HH Công nghiệp chế biến, chế tạo",
            "GDP HH Sản xuất và phân phối điện",
            "GDP HH Cung cấp nước và xử lý nước thải",
            "GDP HH Xây dựng",
            "GDP HH Dịch vụ",
            "GDP HH Bán buôn bán lẻ, sửa chữa ô tô, mô tô, xe máy",
            "GDP HH Vận tải kho bãi",
            "GDP HH Dịch vụ lưu trú và ăn uống",
            "GDP HH Thông tin và truyền thông",
            "GDP HH Hoạt động tài chính, ngân hàng và bảo hiểm",
            "GDP HH Hoạt động kinh doanh bất động sản",
            "GDP HH Hoạt động chuyên môn, khoa học và công nghệ",
            "GDP HH Hoạt động hành chính và dịch vụ hỗ trợ",
            "GDP HH Hoạt động của các tổ chức chính trị",
            "GDP HH Giáo dục đào tạo",
            "GDP HH Y tế và hoạt động cứu trợ xã hội",
            "GDP HH Nghệ thuật, vui chơi và giải trí",
            "GDP HH Hoạt động dịch vụ khác",
            "GDP HH Hoạt động làm thuê các công việc trong các hộ gia đình",
            "GDP HH Thuế sản phẩm trừ trợ cấp sản phẩm",
          ],
        },
        gdpThuc: {
          gdpThuc: gdpThuc?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.gdp_so_sanh / gdpThuc[index - 4]?.gdp_so_sanh) * 100 - 100,
          })),

          header: [
            "GDP So sánh",
            "GDP Nông nghiệp, lâm nghiệp và thủy sản",
            "GDP Nông nghiệp",
            "GDP Lâm nghiệp",
            "GDP Thủy sản",
            "GDP Công nghiệp và xây dựng",
            "GDP Công nghiệp",
            "GDP Khai khoáng",
            "GDP Sản xuất và phân phối điện",
            "GDP Công nghiệp chế biến, chế tạo",
            "GDP Cung cấp nước và xử lý nước thải",
            "GDP Xây dựng",
            "GDP Dịch vụ",
            "GDP Vận tải kho bãi",
            "GDP Bán buôn bán lẻ, sửa chữa ô tô, mô tô, xe máy",
            "GDP Dịch vụ lưu trú và ăn uống",
            "GDP Thông tin và truyền thông",
            "GDP Hoạt động tài chính, ngân hàng và bảo hiểm",
            "GDP Hoạt động kinh doanh bất động sản",
            "GDP Hoạt động chuyên môn, khoa học và công nghệ",
            "GDP Hoạt động hành chính và dịch vụ hỗ trợ",
            "GDP Hoạt động của các tổ chức chính trị",
            "GDP Giáo dục đào tạo",
            "GDP Y tế và hoạt động cứu trợ xã hội",
            "GDP Nghệ thuật, vui chơi và giải trí",
            "GDP Hoạt động dịch vụ khác",
            "GDP Hoạt động làm thuê các công việc trong các hộ gia đình",
            "GDP Thuế sản phẩm trừ trợ cấp sản phẩm",
          ],
        },
        tongMucBanLeDichVu: {
          tongMucBanLeDichVu: tongMucBanLeDichVu.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.tong_ban_le_hh_va_dv /
                tongMucBanLeDichVu[index - 12]?.tong_ban_le_hh_va_dv) *
              100 -
              100,
          })),
          header: [
            "Tổng bán lẻ HH và DV",
            "Bán lẻ Dịch vụ lưu trú, ăn uống",
            "Bán lẻ Hàng hoá",
            "Bán lẻ Du lịch lữ hành",
            "Bán lẻ Dịch vụ khác",
          ],
        },
        cpi: {
          cpi: cpi?.map((item) => {
            return {
              ...item,
              CPI: item?.CPI - 100,
              CPI_an_uong_ngoai_gia_dinh:
                item?.CPI_an_uong_ngoai_gia_dinh - 100,
              CPI_buu_chinh_vien_thong: item?.CPI_buu_chinh_vien_thong - 100,
              CPI_dich_vu_giao_duc: item?.CPI_dich_vu_giao_duc - 100,
              CPI_dich_vu_y_te: item?.CPI_dich_vu_y_te - 100,
              CPI_do_uong_va_thuoc_la: item?.CPI_do_uong_va_thuoc_la - 100,
              CPI_giao_duc: item?.CPI_giao_duc - 100,
              CPI_giao_thong: item?.CPI_giao_thong - 100,
              CPI_hang_an_va_dich_vu_an_uong:
                item?.CPI_hang_an_va_dich_vu_an_uong - 100,
              CPI_hang_hoa_va_dich_vu_khac:
                item?.CPI_hang_hoa_va_dich_vu_khac - 100,
              CPI_luong_thuc: item?.CPI_luong_thuc - 100,
              CPI_may_mac_mu_non_giay_dep:
                item?.CPI_may_mac_mu_non_giay_dep - 100,
              CPI_nha_o_va_vat_lieu_xay_dung:
                item?.CPI_nha_o_va_vat_lieu_xay_dung - 100,
              CPI_thiet_bi_va_do_dung_gia_dinh:
                item?.CPI_thiet_bi_va_do_dung_gia_dinh - 100,
              CPI_thuc_pham: item?.CPI_thuc_pham - 100,
              CPI_thuoc_va_dich_vu_y_te: item?.CPI_thuoc_va_dich_vu_y_te - 100,
              CPI_van_hoa_giai_tri_va_du_lich:
                item?.CPI_van_hoa_giai_tri_va_du_lich - 100,
            };
          }),
          header: [
            "CPI",
            "CPI Hàng ăn và dịch vụ ăn uống",
            "CPI Lương thực",
            "CPI Thực phẩm",
            "CPI Ăn uống ngoài gia đình",
            "CPI Đồ uống và thuốc lá",
            "CPI May mặc, mũ nón, giầy dép",
            "CPI Nhà ở và vật liệu xây dựng",
            "CPI Thiết bị và đồ dùng gia đình",
            "CPI Thuốc và dịch vụ y tế",
            "CPI Dịch vụ y tế",
            "CPI Giao thông",
            "CPI Bưu chính viễn thông",
            "CPI Giáo dục",
            "CPI Dịch vụ giáo dục",
            "CPI Hàng hoá và dịch vụ khác",
            "CPI Văn hoá, giải trí và du lịch",
          ],
        },
        xuatNhapKhau: {
          xuatNhapKhau: xuatNhapKhau?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.XK_tong / xuatNhapKhau[index - 4]?.XK_tong) * 100 - 100,
            thangDuThuongMai: item?.XK_tong - item?.NK_tong,
          })),
          header: [
            "XK Tổng",
            "XK Khu vực trong nước",
            "XK Khu vực trong FDI",
            "NK Tổng",
            "NK Khu vực trong nước",
            "NK Khu vực trong FDI",
          ],
        },
        fdi: {
          fdi,
          header: [
            "Vốn thực hiện FDI",
            "Đăng ký tăng thêm FDI",
            "Góp vốn, mua cổ phần FDI",
            "Đăng ký cấp mới FDI",
            "Vốn đăng ký FDI",
            "Số dự án cấp mới FDI",
            "Số dự án tăng vốn FDI",
          ],
        },
        vonDauTuNganSachNhaNuoc: {
          vonDauTuNganSachNhaNuoc: vonDauTuNganSachNhaNuoc?.map(
            (item, index) => ({
              ...item,
              tangTruongCungKy:
                (item?.von_nsnn_tong /
                  vonDauTuNganSachNhaNuoc[index - 12]?.von_nsnn_tong) *
                100 -
                100,
            })
          ),
          header: [
            "Vốn NSNN Tổng",
            "Vốn NSNN Trung ương",
            "Vốn NSNN Bộ Y tế",
            "Vốn NSNN Bộ Giáo dục - Đào tạo",
            "Vốn NSNN Bộ Giao thông vận tải",
            "Vốn NSNN Bộ Giao thông vận tải",
            "Vốn NSNN Bộ NN và PTNT",
            "Vốn NSNN Bộ Tài nguyên và Môi trường",
            "Vốn NSNN Bộ Xây dựng",
            "Vốn NSNN Bộ Công thương",
            "Vốn NSNN Bộ Văn hóa, Thể thao và Du lịch",
            "Vốn NSNN Bộ Khoa học và Công nghệ",
            "Vốn NSNN Bộ Thông tin và Truyền thông",
            "Vốn NSNN Địa phương",
            "Vốn NSNN Vốn ngân sách NN cấp huyện",
            "Vốn NSNN Vốn ngân sách NN cấp xã",
            "Vốn NSNN Vốn ngân sách NN cấp tỉnh",
          ],
        },
        khoiLuongSanXuatCongNghiep: {
          khoiLuongSanXuatCongNghiep,
          header: [
            "SLSX Than đá (Than sạch)",
            "SLSX Khí đốt thiên nhiên dạng khí",
            "SLSX Khí hoá lỏng (LPG)",
            "SLSX Dầu mỏ thô khai thác",
            "SLSX Thuỷ hải sản chế biến",
            "SLSX Sữa bột",
            "SLSX Dầu thực vật tinh luyện",
            "SLSX Đường kính",
            "SLSX Bia",
            "SLSX Thuốc lá điếu",
            "SLSX Vải dệt từ sợi tự nhiên",
            "SLSX Vải dệt từ sợi tổng hợp hoặc sợi nhân tạo",
            "SLSX Quần áo mặc thường",
            "SLSX Giày thể thao",
            "SLSX Giày, dép da",
            "SLSX Giấy, bìa",
            "SLSX Phân hoá học",
            "SLSX Sơn hoá học",
            "SLSX Xà phòng giặt",
            "SLSX Lốp ô tô, máy kéo",
            "SLSX Kính thuỷ tinh",
            "SLSX Gạch xây bằng đất nung",
            "SLSX Gạch lát ceramic",
            "SLSX Xi măng",
            "SLSX Thép tròn",
            "SLSX Điều hoà nhiệt độ",
            "SLSX Tủ lạnh, tủ đá",
            "SLSX Tivi",
            "SLSX Máy giặt",
            "SLSX Xe tải",
            "SLSX Xe chở khách",
            "SLSX Xe máy",
            "SLSX Nước máy thương phẩm",
            "SLSX Điện sản xuất",
            "SLSX Biến thế điện",
            "SLSX Ô tô",
            "SLSX Thức ăn cho gia súc",
            "SLSX Xăng, dầu",
            "SLSX Alumin",
            "SLSX Sữa tươi",
            "SLSX Thức ăn cho thủy sản",
            "SLSX Bột ngọt",
            "SLSX Phân U rê",
            "SLSX Phân hỗn hợp N.P.K",
            "SLSX Sắt, thép thô",
            "SLSX Thép cán",
            "SLSX Thép thanh, thép góc",
            "SLSX Linh kiện điện thoại",
            "SLSX Dầu gội đầu, dầu xả",
            "SLSX Điện thoại di động",
            "SLSX Sữa tắm, sữa rửa mặt",
          ],
        },
        pmi: {
          pmi,
          header: ["PMI"],
        },
        iip: {
          iip,
          header: ["IIP"],
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/messages/:conversationId", authenticateToken, async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.userId;
  const conversationType = req.query.type; // 'group' or 'user'

  let messages;
  if (conversationType === "group") {
    // Fetch messages from the group
    messages = await query(
      "SELECT m.*, u.name, u.image as avatar FROM messages m JOIN users u ON m.sender_id = u.userID WHERE m.group_id = ? ORDER BY m.created_at DESC",
      [conversationId]
    );
  } else if (conversationType === "user") {
    // Fetch private conversation messages between the authenticated user and the specified user
    messages = await query(
      "SELECT m.*, u.name, u.image as avatar FROM messages m JOIN users u ON m.sender_id = u.userID WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ORDER BY m.created_at DESC",
      [userId, conversationId, conversationId, userId]
    );
  } else {
    // Invalid type or not provided
    return res
      .status(400)
      .json({ error: true, message: "Invalid or missing conversation type" });
  }

  res.json({ success: true, messages });
});
app.post("/allUser", async (req, res) => {
  const searchUser = req.body.searchUser;
  console.log("searchUser: ", searchUser);
  const users = await query("SELECT * FROM users WHERE name LIKE ?", [
    `%${searchUser}%`,
  ]);
  // const users = await query("SELECT * FROM users");
  res.json(users);
});
const userSocketMap = {};

// Hàm lấy danh sách groupId mà một userId là thành viên
async function getUserGroups(userId, callback) {
  const queryString = "SELECT group_id FROM group_members WHERE user_id = ?";
  let results = await query(queryString, [userId]);
  return results.map((result) => result.group_id);
}

let iboardData = null; // Biến lưu trữ dữ liệu iboard dưới dạng chuỗi

// Hàm cập nhật dữ liệu iboard từ file một cách liên tục
const updateIboardData = async () => {
  try {
    iboardData = await fs.readFileSync("iboard.json", "utf8");
  } catch (err) {
    console.error("Error reading iboard.json:", err);
    iboardData = null;
  }
};

// Gọi hàm updateIboardData mỗi giây
setInterval(updateIboardData, 1000);

io.on("connection", async (socket) => {
  console.log("New client connected", socket.id);

  // // Gửi dữ liệu mỗi giây
  // const sendUpdates = async () => {
  //   let top20DatHOSE = await query(`SELECT * FROM top20_hose`);
  //   let top20DataHNX = await query(`SELECT * FROM top20_hnx`);
  //   let changeCountDataHOSE = await query(
  //     "SELECT * FROM change_count WHERE `index` = 'VNINDEX'"
  //   );
  //   let changeCountDataHNX = await query(
  //     "SELECT * FROM change_count WHERE `index` = 'hnx'"
  //   );
  //   const nuocNgoaiData = await query("SELECT * FROM nuoc_ngoai");
  //   const nuocNgoaiAllData = await query("SELECT * FROM nuoc_ngoai_all");

  //   // let data = fs.readFileSync("iboard.json");
  //   // let iboard = JSON.parse(data);
  //   //if before 9h am reset data to 0
  //   const now = new Date();
  //   const hours = now.getHours();
  //   const minutes = now.getMinutes();
  //   if (hours < 9) {
  //     top20DatHOSE = [];
  //     top20DataHNX = [];
  //     changeCountDataHOSE = [
  //       {
  //         index: "VNINDEX",
  //         noChange: 0,
  //         decline: 0,
  //         advance: 0,
  //         time: "14:45:08",
  //       },
  //     ];
  //     changeCountDataHNX = [
  //       {
  //         index: "HNX",
  //         noChange: 0,
  //         decline: 0,
  //         advance: 0,
  //         time: "14:45:08",
  //       },
  //     ];
  //   }

  //   socket.emit("data", {
  //     top20: {
  //       hose: top20DatHOSE,
  //       hnx: top20DataHNX,
  //     },
  //     changeCount: {
  //       hose: changeCountDataHOSE,
  //       hnx: changeCountDataHNX,
  //     },
  //     nuocNgoai: nuocNgoaiData,
  //     nuocNgoaiAll: nuocNgoaiAllData,
  //     iboard: iboardData,
  //   });
  // };

  // const intervalId = setInterval(sendUpdates, 1000);

  const userId = socket.handshake.query.userId; // Assuming the user ID is passed when the client connects
  userSocketMap[userId] = socket.id;

  const userGroups = await getUserGroups(userId);
  userGroups.forEach((groupId) => {
    socket.join(groupId);
  });
  socket.on("sendMessage", async (data) => {
    let message = JSON.parse(data);
    try {
      const { sender_id, receiver_id, group_id, content, image_url } = message;
      await query(
        "INSERT INTO messages (sender_id, receiver_id, group_id, content, image_url) VALUES (?, ?, ?, ?, ?)",
        [sender_id, receiver_id, group_id, content, image_url]
      );

      // Emit message to the receiver or group
      if (group_id) {
        io.to(group_id).emit("newGroupMessage", message);
      } else {
        const receiverSocketId = userSocketMap[receiver_id];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", message);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  socket.on("shareChart", async (data) => {
    let message = JSON.parse(data);
    try {
      const { sender_id, receiver_id, group_id, content, image_url } = message;

      //get sender info
      const senderInfo = await query("SELECT * FROM users WHERE userID = ?", [
        sender_id,
      ]);

      // Emit message to the receiver or group
      if (group_id) {
        io.to(group_id).emit("newGroupChart", {
          ...message[0],
          senderInfo: senderInfo[0],
        });
      } else {
        const receiverSocketId = userSocketMap[receiver_id];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newChart", {
            ...message[0],
            senderInfo: senderInfo[0],
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  socket.on("sendFriendNotification", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendNotification", {
        senderId,
        message: "Bạn có lời mời kết bạn mới.",
      });
    }
  });

  socket.on("sendFriendResponseNotification", (data) => {
    console.log("data2: ", data);
    const { senderId, receiverId, response } = data;
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      const message =
        response === "accepted"
          ? "Lời mời kết bạn của bạn đã được chấp nhận."
          : "Lời mời kết bạn của bạn đã bị từ chối.";
      io.to(receiverSocketId).emit("friendResponseNotification", {
        senderId,
        response,
        message,
      });
    }
  });

  // Handle joining a group
  socket.on("joinGroup", ({ groupId }) => {
    socket.join(groupId);
  });

  socket.on("disconnect", () => {
    // clearInterval(intervalId);
    console.log("Client disconnected", socket.id);
    delete userSocketMap[userId];
  });
});
ioHome.on("connection", async (socket) => {
  console.log("New client connected", socket.id);

  // Gửi dữ liệu mỗi giây
  const sendUpdates = async () => {
    let top20DatHOSE = await query(`SELECT * FROM top20_hose`);
    let top20DataHNX = await query(`SELECT * FROM top20_hnx`);
    let changeCountDataHOSE = await query(
      "SELECT * FROM change_count WHERE `index` = 'VNINDEX'"
    );
    let changeCountDataHNX = await query(
      "SELECT * FROM change_count WHERE `index` = 'hnx'"
    );
    const nuocNgoaiData = await query("SELECT * FROM nuoc_ngoai");
    const nuocNgoaiAllData = await query("SELECT * FROM nuoc_ngoai_all");

    // let data = fs.readFileSync("iboard.json");
    // let iboard = JSON.parse(data);
    //if before 9h am reset data to 0
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 9) {
      top20DatHOSE = [];
      top20DataHNX = [];
      changeCountDataHOSE = [
        {
          index: "VNINDEX",
          noChange: 0,
          decline: 0,
          advance: 0,
          time: "14:45:08",
        },
      ];
      changeCountDataHNX = [
        {
          index: "HNX",
          noChange: 0,
          decline: 0,
          advance: 0,
          time: "14:45:08",
        },
      ];
    }

    socket.emit("data", {
      top20: {
        hose: top20DatHOSE,
        hnx: top20DataHNX,
      },
      changeCount: {
        hose: changeCountDataHOSE,
        hnx: changeCountDataHNX,
      },
      nuocNgoai: nuocNgoaiData,
      nuocNgoaiAll: nuocNgoaiAllData,
      iboard: iboardData,
    });
  };

  const intervalIdHome = setInterval(sendUpdates, 1000);

  socket.on("disconnect", () => {
    clearInterval(intervalIdHome);
    console.log("Client disconnected", socket.id);
  });
});

app.put("/quan_tri_von", async function (req, res) {
  let data = req.body.data;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  await query("UPDATE quan_tri_von SET ? WHERE symbol = ?", [
    data,
    data.symbol,
  ]);
  res.send({ error: false, data: data, message: "Cập nhật thành công" });
});

//GIAO DỊCH GIẢ LẬP

//Tạo tài khoản
app.post("/createAccount", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const accountName = req.body.accountName;

    // Initial balance and total profit loss are set as per your requirement
    const initialBalance = 500000000;
    const totalProfitLoss = 0;

    await query(
      "INSERT INTO UserAccounts (userId, accountName, balance, totalProfitLoss) VALUES (?, ?, ?, ?)",
      [userId, accountName, initialBalance, totalProfitLoss]
    );

    res.status(201).send({ message: "Account created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//Lấy thông tin tài khoản
app.get("/getAccountInfo", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      "SELECT accountName, balance, totalProfitLoss FROM UserAccounts WHERE userId = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "Account not found" });
    }

    res.send(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//đặt giao dịch
app.post("/placeOrder", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { stockSymbol, transactionType, quantity, price } = req.body;

    // Tính tổng giá trị giao dịch
    const totalValue = quantity * price;

    // Truy vấn để lấy thông tin tài khoản
    const accountInfo = await query(
      "SELECT accountName, balance, totalProfitLoss FROM UserAccounts WHERE userId = ?",
      [userId]
    );

    // Kiểm tra thông tin tài khoản
    if (accountInfo.length === 0) {
      throw new Error("Account information not found");
    }

    let updatedBalance = accountInfo[0].balance;

    // Trừ tiền nếu là lệnh mua
    if (transactionType === "buy") {
      if (updatedBalance < totalValue) {
        throw new Error("Insufficient balance to place order");
      }
      updatedBalance -= totalValue;

      // Cập nhật số dư tài khoản trong cơ sở dữ liệu
      await query("UPDATE UserAccounts SET balance = ? WHERE userId = ?", [
        updatedBalance,
        userId,
      ]);
    }

    // Chèn lệnh giao dịch vào cơ sở dữ liệu
    await query(
      "INSERT INTO Transactions (userId, stockSymbol, transactionType, quantity, price) VALUES (?, ?, ?, ?, ?)",
      [userId, stockSymbol, transactionType, quantity, price]
    );

    // Tạo phản hồi
    const response = {
      message: "Order placed successfully",
      accountName: accountInfo[0].accountName,
      balance: updatedBalance,
      totalProfitLoss: accountInfo[0].totalProfitLoss,
    };

    res.status(201).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//danh sách chứng khoán đã mua
app.get("/getPortfolio", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      "SELECT stockSymbol, quantity, purchasePrice, currentPrice, profitLoss, profitLossPercentage FROM holdings WHERE userId = ?",
      [userId]
    );
    if (result.length === 0) {
      return res.status(404).send({ error: "No holdings found" });
    }

    res.send({ holdings: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//Insert User Config
app.post("/user-config-insert", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Assuming `userId` is set by `authenticateToken` middleware
  const config = req.body;

  try {
    await query(
      `
      INSERT INTO user_configs (userID, listPair, listInterval, Wiliams, DMI_ADX, MFI, RSI, RSIdown, Stoch, MACD, EMA, MA, RS, WiliamsValue, DMI_ADXValue, MFIValue, RSIValue, RSIdownValue, StochValue, MACDValue, EMAValue, MAValue, RSValue) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      listPair = VALUES(listPair), 
      listInterval = VALUES(listInterval), 
      Wiliams = VALUES(Wiliams), 
      DMI_ADX = VALUES(DMI_ADX), 
      MFI = VALUES(MFI), 
      RSI = VALUES(RSI), 
      RSIdown = VALUES(RSIdown), 
      Stoch = VALUES(Stoch), 
      MACD = VALUES(MACD), 
      EMA = VALUES(EMA), 
      MA = VALUES(MA), 
      RS = VALUES(RS), 
      WiliamsValue = VALUES(WiliamsValue), 
      DMI_ADXValue = VALUES(DMI_ADXValue), 
      MFIValue = VALUES(MFIValue), 
      RSIValue = VALUES(RSIValue), 
      RSIdownValue = VALUES(RSIdownValue), 
      StochValue = VALUES(StochValue), 
      MACDValue = VALUES(MACDValue), 
      EMAValue = VALUES(EMAValue), 
      MAValue = VALUES(MAValue), 
      RSValue = VALUES(RSValue)
    `,
      [
        userId,
        JSON.stringify(config.listPair),
        JSON.stringify(config.listInterval),
        config.Wiliams,
        config.DMI_ADX,
        config.MFI,
        config.RSI,
        config.RSIdown,
        config.Stoch,
        config.MACD,
        config.EMA,
        config.MA,
        config.RS,
        config.WiliamsValue,
        config.DMI_ADXValue,
        config.MFIValue,
        config.RSIValue,
        config.RSIdownValue,
        config.StochValue,
        config.MACDValue,
        config.EMAValue,
        config.MAValue,
        config.RSValue,
      ]
    );

    res.send({ success: true, message: "Configuration updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/user-config-get/", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Or use req.user.userId to get the user's own config

  try {
    const result = await query("SELECT * FROM user_configs WHERE userID = ?", [
      userId,
    ]);
    if (result.length === 0) {
      return res.status(404).send({ error: "Configuration not found" });
    }

    res.send({ success: true, config: result[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API Chia Sẻ Cấu Hình
// Chia sẻ cấu hình người dùng
app.post("/user-config-share", authenticateToken, async (req, res) => {
  const ownerUserId = req.user.userId;
  const { configId, sharedWithUserIds } = req.body;

  try {
    // Vòng lặp qua mỗi userId để chia sẻ cấu hình
    for (const sharedWithUserId of sharedWithUserIds) {
      await query(
        `
        INSERT INTO user_config_shares (config_id, owner_user_id, shared_with_user_id, status, created_at, updated_at) 
        VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
        [configId, ownerUserId, sharedWithUserId]
      );
    }

    res.send({ success: true, message: "Configuration shared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API Lấy Danh Sách Cấu Hình Được Yêu Cầu Chia Sẻ
app.get("/user-config-share-requests", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await query(
      `SELECT ucs.share_id, ucs.config_id, ucs.owner_user_id, ucs.status, uc.*
       FROM user_config_shares ucs
       JOIN user_configs uc ON ucs.config_id = uc.userID
       WHERE ucs.shared_with_user_id = ? AND ucs.status = 'pending'`,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No share requests found" });
    }

    res.send({ success: true, shareRequests: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API Đồng Ý/Từ Chối Chia Sẻ
// Người dùng đồng ý hoặc từ chối chia sẻ cấu hình
app.post("/user-config-share-response", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { shareId, response } = req.body; // response có thể là 'accepted' hoặc 'declined'

  try {
    await query(
      `
      UPDATE user_config_shares 
      SET status = ? 
      WHERE share_id = ? AND shared_with_user_id = ?`,
      [response, shareId, userId]
    );

    res.send({ success: true, message: "Response recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API Lấy Cấu Hình Được Chia Sẻ
// Lấy cấu hình được chia sẻ với người dùng
app.get("/user-config-shared", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await query(
      `
      SELECT uc.* FROM user_configs uc
      INNER JOIN user_config_shares ucs ON uc.userID = ucs.owner_user_id
      WHERE ucs.shared_with_user_id = ? AND ucs.status = 'accepted'`,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No shared configuration found" });
    }

    res.send({ success: true, sharedConfigs: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/matchOrder", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId, matchedPrice } = req.body;

    // Start a transaction
    await query("START TRANSACTION");

    // Get the order details
    const orderDetails = await query(
      "SELECT stockSymbol, transactionType, quantity, price FROM Transactions WHERE userId = ? AND transactionId = ?",
      [userId, orderId]
    );
    if (orderDetails.length === 0) {
      await query("ROLLBACK");
      return res.status(404).send({ error: "Order not found" });
    }

    const { stockSymbol, transactionType, quantity, price } = orderDetails[0];
    const totalCost = matchedPrice * quantity;

    // Update user's balance
    if (transactionType === "buy") {
      await query(
        "UPDATE UserAccounts SET balance = balance - ? WHERE userId = ?",
        [totalCost, userId]
      );
    } else {
      // if sell
      await query(
        "UPDATE UserAccounts SET balance = balance + ? WHERE userId = ?",
        [totalCost, userId]
      );
    }

    // Update Holdings
    if (transactionType === "buy") {
      await query(
        "INSERT INTO holdings (userId, stockSymbol, quantity, purchasePrice) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?, purchasePrice = (purchasePrice * quantity + ?) / (quantity + ?)",
        [
          userId,
          stockSymbol,
          quantity,
          matchedPrice,
          quantity,
          totalCost,
          quantity,
        ]
      );
    } else {
      // if sell
      await query(
        "UPDATE holdings SET quantity = quantity - ? WHERE userId = ? AND stockSymbol = ?",
        [quantity, userId, stockSymbol]
      );
    }

    // Update the order status to 'matched'
    await query(
      "UPDATE Transactions SET status = 'complete', matchedQuantity = ?, averageMatchedPrice = ? WHERE transactionId = ?",
      [quantity, matchedPrice, orderId]
    );

    // Commit the transaction
    await query("COMMIT");

    res.send({ message: "Order matched successfully" });
  } catch (error) {
    await query("ROLLBACK");
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//danh sách giao dịch
app.get("/getOrders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      "SELECT stockSymbol, transactionType, quantity, price, matchedQuantity, averageMatchedPrice, status FROM Transactions WHERE userId = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No orders found" });
    }

    res.send({ orders: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});
app.delete("/quan_tri_von", async function (req, res) {
  let data = req.body;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  await query("DELETE FROM quan_tri_von WHERE symbol = ?", [data.symbol]);
  res.send({ error: false, data: data, message: "Xóa thành công" });
});

//API lấy danh sách tín hiệu của một người dùng
app.get("/signals", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Truy vấn lấy tín hiệu của người dùng
    // const userSignals = await query("SELECT * FROM signals WHERE OwnerID = ?", [
    //   userId,
    // ]);
    // Truy vấn lấy tín hiệu của người dùng và thông tin OwnerId
    const userSignals = await query(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM signals s JOIN users u ON s.OwnerID = u.userID WHERE s.OwnerID = ?",
      [userId]
    );

    // // Truy vấn lấy tín hiệu được chia sẻ với người dùng
    // const sharedSignals = await query(
    //   "SELECT s.*, ss.* FROM sharedsignals ss INNER JOIN signals s ON ss.SignalID = s.SignalID WHERE ss.ReceiverID = ? AND ss.Status = 'ACCEPTED'",
    //   [userId]
    // );
    // Truy vấn lấy tín hiệu được chia sẻ với người dùng và thông tin OwnerId
    const sharedSignals = await query(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM sharedsignals ss JOIN signals s ON ss.SignalID = s.SignalID JOIN users u ON s.OwnerID = u.userID WHERE ss.ReceiverID = ? AND ss.Status = 'ACCEPTED'",
      [userId]
    );

    // Kết hợp kết quả và loại bỏ trùng lặp
    const signalMap = new Map();
    [...userSignals, ...sharedSignals].forEach((signal) => {
      signalMap.set(signal.SignalID, signal);
    });

    // Chuyển Map thành mảng để gửi về client
    const uniqueSignals = Array.from(signalMap.values());

    res.send({ success: true, signals: uniqueSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//delete signal
app.delete("/signals/delete/:SignalID", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { SignalID } = req.params;
    //delete shared signals
    await query("DELETE FROM sharedsignals WHERE SignalID = ?", [SignalID]);

    await query("DELETE FROM signals WHERE SignalID = ? AND OwnerID = ?", [
      SignalID,
      userId,
    ]);
    res.send({ success: true, message: "Signal deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API chia sẻ tín hiệu
app.post("/signals/share", authenticateToken, async (req, res) => {
  try {
    const { SignalID, receiverIDs } = req.body; // Sử dụng mảng receiverIDs
    const SenderID = req.user.userId;

    // Lấy thông tin tín hiệu
    const signal = await query(
      "SELECT * FROM signals WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, SenderID]
    );

    // Vòng lặp qua mỗi ReceiverID và chèn vào cơ sở dữ liệu
    for (const ReceiverID of receiverIDs) {
      await query(
        "INSERT INTO sharedsignals (SignalID, SenderID, ReceiverID) VALUES (?, ?, ?)",
        [SignalID, SenderID, ReceiverID]
      );

      const senderInfo = await query("SELECT * FROM users WHERE userID = ?", [
        SenderID,
      ]);

      const receiverSocketId = userSocketMap[ReceiverID];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newChart", [signal[0], senderInfo[0]]);
      }
    }

    res.send({
      success: true,
      message: "Signal shared successfully with multiple users",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//get list shared signals to aprove or reject
app.get("/signals/list-share-request", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sharedSignals = await query(
      "SELECT sharedsignals.*, users.name, users.image, users.userID, users.isOnline, signals.* " +
      "FROM sharedsignals " +
      "JOIN users ON sharedsignals.SenderID = users.userID " +
      "JOIN signals ON sharedsignals.SignalID = signals.SignalID " +
      "WHERE sharedsignals.ReceiverID = ? AND sharedsignals.Status = 'PENDING'",
      [userId]
    );
    res.send({ success: true, sharedSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API xác nhận hoặc từ chối tín hiệu được chia sẻ
app.post("/signals/respond", authenticateToken, async (req, res) => {
  try {
    const { SharedID, Status } = req.body; // Status can be 'ACCEPTED' or 'REJECTED'
    const ReceiverID = req.user.userId;
    await query(
      "UPDATE sharedsignals SET Status = ?, RespondedAt = NOW() WHERE SharedID = ? AND ReceiverID = ?",
      [Status, SharedID, ReceiverID]
    );
    res.send({ success: true, message: "Response recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API lấy danh sách tín hiệu đã chia sẻ của một tín hiệu
app.get("/signals/shared", authenticateToken, async (req, res) => {
  try {
    const SignalID = req.query.SignalID;
    const sharedSignals = await query(
      "SELECT SharedSignals.*, users.name, users.image, users.userID, users.isOnline " +
      "FROM SharedSignals " +
      "JOIN users ON SharedSignals.ReceiverID = users.userID " +
      "WHERE SharedSignals.SignalID = ?",
      [SignalID]
    );
    res.send({ success: true, sharedSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//ADD signal
app.post("/signals/add", authenticateToken, async (req, res) => {
  try {
    // Giả sử các trường dữ liệu tín hiệu được gửi qua body của request
    const { signalInfo, ownerId, symbol, signalName } = req.body;
    let signalInfoStringify = JSON.stringify(signalInfo);
    // Kiểm tra dữ liệu đầu vào
    if (!signalInfo || !ownerId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing required fields" });
    }
    let creationDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    // Thêm tín hiệu vào cơ sở dữ liệu
    await query(
      "INSERT INTO Signals (OwnerID, SignalInfo, CreatedAt, symbol, SignalName) VALUES (?, ?, ?, ?, ?)",
      [ownerId, signalInfoStringify, creationDate, symbol, signalName]
    );

    res.send({ success: true, message: "Signal added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//API LIST CHI TIEU
// API lấy danh sách listChiTieu của một người dùng
app.get("/listChiTieu", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Truy vấn lấy tín hiệu của người dùng và thông tin OwnerId
    const userSignals = await query(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM listchitieu s JOIN users u ON s.OwnerID = u.userID WHERE s.OwnerID = ?",
      [userId]
    );

    // Truy vấn lấy tín hiệu được chia sẻ với người dùng và thông tin OwnerId
    const sharedSignals = await query(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM shared_listChiTieu ss JOIN listchitieu s ON ss.SignalID = s.SignalID JOIN users u ON s.OwnerID = u.userID WHERE ss.ReceiverID = ? AND ss.Status = 'ACCEPTED'",
      [userId]
    );

    // Kết hợp kết quả và loại bỏ trùng lặp
    const signalMap = new Map();
    [...userSignals, ...sharedSignals].forEach((signal) => {
      signalMap.set(signal.SignalID, signal);
    });

    // Chuyển Map thành mảng để gửi về client
    const uniqueSignals = Array.from(signalMap.values());

    res.send({ success: true, signals: uniqueSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API xóa listChiTieu
app.delete(
  "/listChiTieu/delete/:SignalID",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { SignalID } = req.params;

      // Xóa các bản ghi chia sẻ tín hiệu
      await query("DELETE FROM shared_listChiTieu WHERE SignalID = ?", [
        SignalID,
      ]);

      // Xóa tín hiệu của người dùng
      await query(
        "DELETE FROM listchitieu WHERE SignalID = ? AND OwnerID = ?",
        [SignalID, userId]
      );

      res.send({ success: true, message: "Signal deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
);

// API chia sẻ listChiTieu
app.post("/listChiTieu/share", authenticateToken, async (req, res) => {
  try {
    const { SignalID, receiverIDs } = req.body; // Sử dụng mảng receiverIDs
    const SenderID = req.user.userId;

    // Lấy thông tin tín hiệu
    const signal = await query(
      "SELECT * FROM listchitieu WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, SenderID]
    );

    if (signal.length === 0) {
      return res.status(404).send({ error: true, message: "Signal not found" });
    }

    // Vòng lặp qua mỗi ReceiverID và chèn vào cơ sở dữ liệu
    for (const ReceiverID of receiverIDs) {
      await query(
        "INSERT INTO shared_listChiTieu (SignalID, SenderID, ReceiverID) VALUES (?, ?, ?)",
        [SignalID, SenderID, ReceiverID]
      );

      const senderInfo = await query("SELECT * FROM users WHERE userID = ?", [
        SenderID,
      ]);

      const receiverSocketId = userSocketMap[ReceiverID];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newChart", [signal[0], senderInfo[0]]);
      }
    }

    res.send({
      success: true,
      message: "Signal shared successfully with multiple users",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API lấy danh sách yêu cầu chia sẻ listChiTieu để phê duyệt hoặc từ chối
app.get(
  "/listChiTieu/list-share-request",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const sharedSignals = await query(
        "SELECT shared_listChiTieu.*, users.name, users.image, users.userID, users.isOnline, listchitieu.* " +
        "FROM shared_listChiTieu " +
        "JOIN users ON shared_listChiTieu.SenderID = users.userID " +
        "JOIN listchitieu ON shared_listChiTieu.SignalID = listchitieu.SignalID " +
        "WHERE shared_listChiTieu.ReceiverID = ? AND shared_listChiTieu.Status = 'PENDING'",
        [userId]
      );
      res.send({ success: true, sharedSignals });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
);

// API xác nhận hoặc từ chối yêu cầu chia sẻ listChiTieu
app.post("/listChiTieu/respond", authenticateToken, async (req, res) => {
  try {
    const { SharedID, Status } = req.body; // Status có thể là 'ACCEPTED' hoặc 'REJECTED'
    const ReceiverID = req.user.userId;

    // Kiểm tra Status hợp lệ
    if (!["ACCEPTED", "REJECTED"].includes(Status)) {
      return res
        .status(400)
        .send({ error: true, message: "Invalid status value" });
    }

    const result = await query(
      "UPDATE shared_listChiTieu SET Status = ?, RespondedAt = NOW() WHERE SharedID = ? AND ReceiverID = ?",
      [Status, SharedID, ReceiverID]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .send({ error: true, message: "Shared request not found" });
    }

    res.send({ success: true, message: "Response recorded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API lấy danh sách listChiTieu đã chia sẻ của một listChiTieu
app.get("/listChiTieu/shared", authenticateToken, async (req, res) => {
  try {
    const SignalID = req.query.SignalID;

    if (!SignalID) {
      return res
        .status(400)
        .send({ error: true, message: "SignalID is required" });
    }

    const sharedSignals = await query(
      "SELECT shared_listChiTieu.*, users.name, users.image, users.userID, users.isOnline " +
      "FROM shared_listChiTieu " +
      "JOIN users ON shared_listChiTieu.ReceiverID = users.userID " +
      "WHERE shared_listChiTieu.SignalID = ?",
      [SignalID]
    );

    res.send({ success: true, sharedSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API thêm mới listChiTieu
app.post("/listChiTieu/add", authenticateToken, async (req, res) => {
  try {
    // Giả sử các trường dữ liệu tín hiệu được gửi qua body của request
    const { signalInfo, ownerId, symbol, signalName } = req.body;

    let signalInfoStringify = JSON.stringify(signalInfo);
    let symbolInfo = JSON.stringify(symbol);
    // Kiểm tra dữ liệu đầu vào
    if (!signalInfo || !ownerId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing required fields" });
    }

    let creationDate = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Thêm tín hiệu vào cơ sở dữ liệu
    await query(
      "INSERT INTO listchitieu (OwnerID, SignalInfo, CreatedAt, symbol, SignalName) VALUES (?, ?, ?, ?, ?)",
      [ownerId, signalInfoStringify, creationDate, symbolInfo, signalName]
    );

    res.send({ success: true, message: "Signal added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// API để lấy tất cả cài đặt và điều kiện cho một người dùng
app.get("/user/settings", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Lấy userId từ token đã xác thực
  try {
    // Lấy tất cả cài đặt của người dùng
    // const settings = await query(
    //   "SELECT settingID, name FROM settings WHERE userID = ?",
    //   [userId]
    // );

    // // Lặp qua mỗi cài đặt để lấy điều kiện tương ứng
    // for (let setting of settings) {
    //   const conditions = await query(
    //     "SELECT name, value FROM setting_conditions WHERE settingID = ?",
    //     [setting.settingID]
    //   );
    //   setting.conditions = conditions; // Thêm danh sách điều kiện vào mỗi cài đặt
    // }
    //get all bo_loc_ky_thuat table
    const boLocKyThuat = await query(
      "SELECT * FROM bo_loc_ky_thuat WHERE userID = ?",
      [userId]
    );
    res.send({ success: true, data: boLocKyThuat });

    // res.send({ success: true, settings: settings });
  } catch (error) {
    console.error("Failed to fetch settings and conditions:", error);
    res.status(500).send({ error: true, message: "Internal Server Error" });
  }
});

// API để cập nhật QUA_MUA và QUA_BAN
app.post("/settings/updateConditions", authenticateToken, async (req, res) => {
  const { listTieuChi } = req.body;
  const userId = req.user.userId; // Lấy userId từ token đã xác thực
  // if (!settingID || !conditions || conditions.length === 0) {
  //   return res.status(400).send({ error: true, message: "Missing parameters" });
  // }

  try {
    for (const condition of conditions) {
      await query(
        `
        INSERT INTO setting_conditions (settingID, name, value)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
      `,
        [settingID, condition.name, condition.value]
      );
    }
    res.send({ success: true, message: "Conditions updated successfully." });
  } catch (error) {
    console.error("Failed to update conditions:", error);
    res.status(500).send({ error: true, message: "Internal Server Error" });
  }
});

app.post("/input_quan_tri_von", async function (req, res) {
  let data = req.body.data;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  await query("INSERT INTO input_quan_tri_von SET ?", data);
  res.send({ error: false, data: data, message: "Cập nhật thành công" });
});

app.get("/input_quan_tri_von", async function (req, res) {
  let data = await query("SELECT * FROM input_quan_tri_von");
  res.send({
    error: false,
    data: data[data.length - 1],
    message: "input_quan_tri_von list.",
  });
});

app.get("/DailyStockPrice", async function (req, res) {
  const { symbol, fromDate, toDate } = req.query;

  // //wait 1s
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  let response = await axios.get(
    `http://localhost:3030/DailyStockPrice?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
  );
  let listSymbolData = response?.data?.data;
  res.send({
    error: false,
    data: listSymbolData,
    message: "DailyStockPrice list.",
  });
});

// API to get all iboards for a user
app.get("/iboards", authenticateToken, async (req, res) => {
  const userID = req.user.userId;
  try {
    const boards = await query("SELECT * FROM iboard WHERE userID = ?", [
      userID,
    ]);
    res.json({ success: true, boards });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch iboards" });
  }
});

// API to create a new iboard
app.post("/iboard", authenticateToken, async (req, res) => {
  const userID = req.user.userId;
  const { title } = req.body;
  if (!title || !userID) {
    return res
      .status(400)
      .send({ error: true, message: "Missing title or userID" });
  }
  try {
    await query("INSERT INTO iboard (title, userID) VALUES (?, ?)", [
      title,
      userID,
    ]);
    res.send({ success: true, message: "iboard created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to create iboard" });
  }
});

// API to update an iboard
app.put("/iboard/:id", authenticateToken, async (req, res) => {
  const { title } = req.body;
  const { id } = req.params;
  try {
    await query("UPDATE iboard SET title = ? WHERE id = ?", [title, id]);
    res.send({ success: true, message: "iboard updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update iboard" });
  }
});

// API to delete an iboard
app.delete("/iboard/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM iboard WHERE id = ?", [id]);
    res.send({ success: true, message: "iboard deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to delete iboard" });
  }
});

// API to get all iboard_details for an iboard
app.get("/iboard_details/:iboardID", authenticateToken, async (req, res) => {
  const { iboardID } = req.params;
  try {
    const details = await query(
      "SELECT * FROM iboard_detail WHERE iboardID = ?",
      [iboardID]
    );
    res.json({ success: true, details });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch iboard_details" });
  }
});

// API to add a symbol to an iboard_detail
app.post("/iboard_detail", authenticateToken, async (req, res) => {
  const { iboardID, list_symbol } = req.body;
  if (!iboardID || !list_symbol) {
    return res.status(400).send({
      error: true,
      message: "Please provide iboardID and list_symbol",
    });
  }
  try {
    await query(
      "INSERT INTO iboard_detail (iboardID, list_symbol) VALUES (?, ?)",
      [iboardID, list_symbol]
    );
    res.send({
      success: true,
      message: "Symbol added to iboard_detail successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to add symbol to iboard_detail" });
  }
});

// API to update an iboard_detail
app.put("/iboard_detail/:id", authenticateToken, async (req, res) => {
  const { list_symbol } = req.body;
  const { id } = req.params;
  try {
    await query("UPDATE iboard_detail SET list_symbol = ? WHERE id = ?", [
      list_symbol,
      id,
    ]);
    res.send({ success: true, message: "iboard_detail updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update iboard_detail" });
  }
});

// API to delete an iboard_detail
app.delete("/iboard_detail/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM iboard_detail WHERE id = ?", [id]);
    res.send({ success: true, message: "iboard_detail deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to delete iboard_detail" });
  }
});

//get symbol info
app.get("/symbol_info", async (req, res) => {
  const symbol_query = req.query?.query;
  let listSymbolData = [];

  // let response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  // );
  // listSymbolData = response?.data?.data || listSymbolData;
  // //wait 1s
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // response = await axios.get(
  //   `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  // );
  // // let ssiInfoResponse = await axios.get(
  // //   `https://iboard-query.ssi.com.vn/stock/${query}`
  // // );
  // // let ssiInfo = ssiInfoResponse.data.data;
  // listSymbolData = response.data.data
  //   ? [...listSymbolData, ...response.data.data]
  //   : listSymbolData;
  let response = await query("SELECT * from symbol_info");

  listSymbolData = response;
  let listSymbolMap = listSymbolData.map((item) => {
    return {
      symbol: item?.symbol,
      full_name: item?.full_name,
      // description: ssiInfo?.companyNameVi,
      description: item?.description,
      exchange: item?.exchange,
      type: item?.type,
      exchange_logo: item?.exchange_logo,
    };
  });
  const filteredResults = listSymbolMap.filter((data) => {
    return data.symbol?.trim() == symbol_query?.trim();
  });
  return res.json(filteredResults);

  // try {
  //   let ssiInfoResponse = await axios.get(
  //     `https://iboard-query.ssi.com.vn/stock/${query}`
  //   );
  //   let ssiInfo = ssiInfoResponse.data.data;
  //   let filteredResults = [
  //     {
  //       symbol: ssiInfo?.stockSymbol,
  //       full_name: ssiInfo?.stockSymbol,
  //       description: ssiInfo?.companyNameVi,
  //       // description: item?.StockName,
  //       exchange: ssiInfo?.exchange?.toUpperCase(),
  //       type: "Cổ phiếu",
  //       exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
  //     }
  //   ]
  //   return res.json(filteredResults);
  // } catch (error) {
  //   console.log("error: ", error);
  //   res.json({});
  // }
});

app.get("/stocks/iboard", async (req, res) => {
  //read data from iboard.json JSON file
  try {
    let data = fs.readFileSync("iboard.json");
    let iboard = JSON.parse(data);
    res.send(iboard);
  } catch (error) {
    res.send(null);
  }
});

app.get("/statistics/company/stock-price", async function (req, res) {
  let { symbol, page, pageSize, fromDate, toDate } = req.query;

  // Convert dates to ISO format (yyyy-mm-dd)
  fromDate = convertDateToISO(fromDate);
  toDate = convertDateToISO(toDate);

  // Tính tổng số bản ghi
  const countQuery = `
      SELECT COUNT(*) AS total FROM stock_price
      WHERE symbol = ?
      AND DATE_FORMAT(STR_TO_DATE(tradingDate, '%d/%m/%Y %H:%i:%s'), '%Y-%m-%d') BETWEEN ? AND ?`;

  const totalRecords = await query(countQuery, [symbol, fromDate, toDate]);
  const total = totalRecords[0].total;

  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;

  // Prepare SQL query for fetching data
  const queryStr = `
      SELECT * FROM stock_price
      WHERE symbol = ?
      AND DATE_FORMAT(STR_TO_DATE(tradingDate, '%d/%m/%Y %H:%i:%s'), '%Y-%m-%d') BETWEEN ? AND ?
      LIMIT ? OFFSET ?`;

  try {
    const results = await query(queryStr, [
      symbol,
      fromDate,
      toDate,
      parseInt(pageSize),
      offset,
    ]);

    // Prepare pagination object
    const paging = {
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };

    res.json({
      code: "SUCCESS",
      message: "Get stock price data success",
      data: results,
      paging: paging,
    });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/bao_cao_phan_tich", async function (req, res) {
  let symbol = req.query.symbol;
  let data = await query("SELECT * FROM bao_cao_phan_tich WHERE `code` = ?", [
    symbol,
  ]);
  res.send({
    error: false,
    data: data,
    message: "Báo cáo phân tích list.",
  });
});

//MUA BÁN CHỦ ĐỘNG
//get list mua_ban_chu_dong in newest date by symbol sort by Time
app.get("/mua_ban_chu_dong", async function (req, res) {
  let symbol = req.query.symbol;

  // let latestDate = await getLatestDate();
  let data = await query(
    "SELECT * FROM mua_ban_chu_dong WHERE symbol = ?  ORDER BY Time DESC",
    [symbol]
  );

  res.send({
    error: false,
    data: data,
    message: "mua_ban_chu_dong list.",
  });
});
app.get("/mua_ban_chu_dong_short", async function (req, res) {
  let symbol = req.query.symbol;
  console.log("symbol muaBanChuDong: ", symbol);
  // let latestDate = await getLatestDate();
  try {
    let data = await axios.get(
      `https://api.finpath.vn/api/stocks/v2/trades/${symbol}?page=1&pageSize=3000`,
      { httpsAgent }
    );
    let dataResponse = data?.data?.data?.trades;

    let dataBidAsk = await axios.get(
      `https://api.finpath.vn/api/stocks/orderbook/${symbol}`,
      { httpsAgent }
    );
    let dataBidAskResponse = dataBidAsk?.data?.data?.orderbook;
    let dataResponseMap = dataResponse?.map((item, index) => {
      return {
        id: index,
        symbol: item?.c,
        High: item?.p,
        Low: item?.p,
        Close: item?.p,
        Open: item?.p,
        TradingDate: item?.td,
        Time: item?.t,
        Ceiling: 0,
        Floor: 0,
        RefPrice: item?.p - item?.ch,
        AvgPrice: item?.p,
        PriorVal: item?.p,
        LastPrice: item?.p,
        LastVol: item?.v,
        TotalVal: item?.accumulatedVal,
        TotalVol: item?.tv,
        TotalBuyVol: item?.tvb,
        TotalSellVol: item?.tvs,
        TotalOtherVol: item?.tvo,
        BidPrice1: dataBidAskResponse?.bids[0]?.price,
        BidPrice2: dataBidAskResponse?.bids[1]?.price,
        BidPrice3: dataBidAskResponse?.bids[2]?.price,
        BidPrice4: dataBidAskResponse?.bids[3]?.price,
        BidPrice5: dataBidAskResponse?.bids[4]?.price,
        BidPrice6: dataBidAskResponse?.bids[5]?.price,
        BidPrice7: dataBidAskResponse?.bids[6]?.price,
        BidPrice8: dataBidAskResponse?.bids[7]?.price,
        BidPrice9: dataBidAskResponse?.bids[8]?.price,
        BidPrice10: dataBidAskResponse?.bids[9]?.price,
        BidVol1: dataBidAskResponse?.bids[0]?.volume,
        BidVol2: dataBidAskResponse?.bids[1]?.volume,
        BidVol3: dataBidAskResponse?.bids[2]?.volume,
        BidVol4: dataBidAskResponse?.bids[3]?.volume,
        BidVol5: dataBidAskResponse?.bids[4]?.volume,
        BidVol6: dataBidAskResponse?.bids[5]?.volume,
        BidVol7: dataBidAskResponse?.bids[6]?.volume,
        BidVol8: dataBidAskResponse?.bids[7]?.volume,
        BidVol9: dataBidAskResponse?.bids[8]?.volume,
        BidVol10: dataBidAskResponse?.bids[9]?.volume,
        AskPrice1: dataBidAskResponse?.asks[0]?.price,
        AskPrice2: dataBidAskResponse?.asks[1]?.price,
        AskPrice3: dataBidAskResponse?.asks[2]?.price,
        AskPrice4: dataBidAskResponse?.asks[3]?.price,
        AskPrice5: dataBidAskResponse?.asks[4]?.price,
        AskPrice6: dataBidAskResponse?.asks[5]?.price,
        AskPrice7: dataBidAskResponse?.asks[6]?.price,
        AskPrice8: dataBidAskResponse?.asks[7]?.price,
        AskPrice9: dataBidAskResponse?.asks[8]?.price,
        AskPrice10: dataBidAskResponse?.asks[9]?.price,
        AskVol1: dataBidAskResponse?.asks[0]?.volume,
        AskVol2: dataBidAskResponse?.asks[1]?.volume,
        AskVol3: dataBidAskResponse?.asks[2]?.volume,
        AskVol4: dataBidAskResponse?.asks[3]?.volume,
        AskVol5: dataBidAskResponse?.asks[4]?.volume,
        AskVol6: dataBidAskResponse?.asks[5]?.volume,
        AskVol7: dataBidAskResponse?.asks[6]?.volume,
        AskVol8: dataBidAskResponse?.asks[7]?.volume,
        AskVol9: dataBidAskResponse?.asks[8]?.volume,
        AskVol10: dataBidAskResponse?.asks[9]?.volume,
        MarketId: "HOSE",
        Exchange: "HOSE",
        TradingSession: dataBidAskResponse?.tradingSession,
        TradingStatus: "N",
        Change: item?.ch,
        RatioChange: item?.chp,
        EstMatchedPrice: item?.p,
        type: item?.s === "buy" ? "B" : item?.s === "sell" ? "S" : "",
      };
    });
    let dataSorted = dataResponseMap.sort((a, b) => {
      const timeA = new Date("1970-01-01T" + a.Time);
      const timeB = new Date("1970-01-01T" + b.Time);
      return timeB - timeA;
    });
    res.send({
      error: false,
      data: dataSorted,
      message: "mua_ban_chu_dong list.",
    });
  } catch (error) {
    console.log("error: ", error);
    res.json({});
  }
  // let data =
  //   await axios.get`https://api-finfo.vndirect.com.vn/v4/stock_intraday_latest?q=code:${symbol}&sort=time&size=100000`();
  // let dataResponse = data?.data?.data?.trades;

  // let dataBidAsk = await axios.get(
  //   `https://api.finpath.vn/api/stocks/orderbook/${symbol}`
  // );
  // let dataBidAskResponse = dataBidAsk?.data?.data?.orderbook;
  // let dataResponseMap = dataResponse?.map((item, index) => {
  //   return {
  //     id: index,
  //     symbol: "SSI",
  //     High: item?.high,
  //     Low: item?.low,
  //     Close: item?.last,
  //     Open: item?.open,
  //     TradingDate: moment(item?.tradingDate, "YYYY-MM-DD")?.format(
  //       "DD/MM/YYYY"
  //     ),
  //     Time: item?.time,
  //     Ceiling: item?.low,
  //     Floor: item?.high,
  //     RefPrice: item?.low,
  //     AvgPrice: item?.low,
  //     PriorVal: item?.low,
  //     LastPrice: item?.last,
  //     LastVol: item?.lastVol,
  //     TotalVal: item?.accumulatedVal,
  //     TotalVol: item?.accumulatedVol,
  //     BidPrice1: dataBidAskResponse?.bids[0]?.price,
  //     BidPrice2: dataBidAskResponse?.bids[1]?.price,
  //     BidPrice3: dataBidAskResponse?.bids[2]?.price,
  //     BidPrice4: dataBidAskResponse?.bids[3]?.price,
  //     BidPrice5: dataBidAskResponse?.bids[4]?.price,
  //     BidPrice6: dataBidAskResponse?.bids[5]?.price,
  //     BidPrice7: dataBidAskResponse?.bids[6]?.price,
  //     BidPrice8: dataBidAskResponse?.bids[7]?.price,
  //     BidPrice9: dataBidAskResponse?.bids[8]?.price,
  //     BidPrice10: dataBidAskResponse?.bids[9]?.price,
  //     BidVol1: dataBidAskResponse?.bids[0]?.volume,
  //     BidVol2: dataBidAskResponse?.bids[1]?.volume,
  //     BidVol3: dataBidAskResponse?.bids[2]?.volume,
  //     BidVol4: dataBidAskResponse?.bids[3]?.volume,
  //     BidVol5: dataBidAskResponse?.bids[4]?.volume,
  //     BidVol6: dataBidAskResponse?.bids[5]?.volume,
  //     BidVol7: dataBidAskResponse?.bids[6]?.volume,
  //     BidVol8: dataBidAskResponse?.bids[7]?.volume,
  //     BidVol9: dataBidAskResponse?.bids[8]?.volume,
  //     BidVol10: dataBidAskResponse?.bids[9]?.volume,
  //     AskPrice1: dataBidAskResponse?.asks[0]?.price,
  //     AskPrice2: dataBidAskResponse?.asks[1]?.price,
  //     AskPrice3: dataBidAskResponse?.asks[2]?.price,
  //     AskPrice4: dataBidAskResponse?.asks[3]?.price,
  //     AskPrice5: dataBidAskResponse?.asks[4]?.price,
  //     AskPrice6: dataBidAskResponse?.asks[5]?.price,
  //     AskPrice7: dataBidAskResponse?.asks[6]?.price,
  //     AskPrice8: dataBidAskResponse?.asks[7]?.price,
  //     AskPrice9: dataBidAskResponse?.asks[8]?.price,
  //     AskPrice10: dataBidAskResponse?.asks[9]?.price,
  //     AskVol1: dataBidAskResponse?.asks[0]?.volume,
  //     AskVol2: dataBidAskResponse?.asks[1]?.volume,
  //     AskVol3: dataBidAskResponse?.asks[2]?.volume,
  //     AskVol4: dataBidAskResponse?.asks[3]?.volume,
  //     AskVol5: dataBidAskResponse?.asks[4]?.volume,
  //     AskVol6: dataBidAskResponse?.asks[5]?.volume,
  //     AskVol7: dataBidAskResponse?.asks[6]?.volume,
  //     AskVol8: dataBidAskResponse?.asks[7]?.volume,
  //     AskVol9: dataBidAskResponse?.asks[8]?.volume,
  //     AskVol10: dataBidAskResponse?.asks[9]?.volume,
  //     MarketId: "HOSE",
  //     Exchange: "HOSE",
  //     TradingSession: "PT",
  //     TradingStatus: "N",
  //     Change: 1150,
  //     RatioChange: "3.33",
  //     EstMatchedPrice: 35650,
  //     type: item?.side === "PB" ? "B" : "S",
  //   };
  // });
  // let dataSorted = dataResponseMap.sort((a, b) => {
  //   const timeA = new Date("1970-01-01T" + a.Time);
  //   const timeB = new Date("1970-01-01T" + b.Time);
  //   return timeA - timeB;
  // });
  // res.send({
  //   error: false,
  //   data: dataSorted,
  //   message: "mua_ban_chu_dong list.",
  // });
});

//Chỉ số thế giới
//get list chỉ số thế giới
app.get("/world-indices", async function (req, res) {
  // let response = await fetch("https://vn.investing.com/indices/world-indices");
  let response = await fetch("https://investing.com/indices/world-indices");
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
  res.send({ error: false, data: data, message: "world-indices list." });
});

//Giá hàng hoá thế giới
app.get("/goods-price", async function (req, res) {
  let response = await fetch(
    "https://investing.com/commodities/real-time-futures"
  );
  let body = await response.text();
  let $ = cheerio.load(body);

  const indices = [
    "Gold",
    "XAU/USD",
    "Silver",
    "XAG/USD",
    "Platinum",
    "Palladium",
    "Crude Oil WTI",
    "Brent Oil",
    "Natural Gas",
    "Heating Oil",
    "Gasoline RBOB",
    "Aluminium",
    "Zinc",
    "Nickel",
    "Copper",
    "US Wheat",
    "Rough Rice",
    "US Corn",
    "Orange Juice",
    "Live Cattle",
    "Lean Hogs",
    "Feeder Cattle",
    "Lumber",
    "Oats",
  ];
  // const indices = [
  //   "Vàng",
  //   "XAU/USD",
  //   "Bạc",
  //   "Đồng",
  //   "Platin",
  //   "Paladi",
  //   "Dầu Thô WTI",
  //   "Dầu Brent",
  //   "Khí Tự nhiên",
  //   "Dầu Nhiên liệu",
  //   "Xăng RBOB",
  //   "Nhôm",
  //   "Kẽm",
  //   "Ni-ken",
  //   "Copper",
  //   "Lúa mì Hoa Kỳ",
  //   "Thóc",
  //   "Bắp Hoa Kỳ",
  //   "Nước Cam",
  //   "Bê",
  //   "Heo nạc",
  //   "Bê đực non",
  //   "Gỗ",
  //   "Yến mạch",
  // ];
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
  res.send({
    error: false,
    data: [
      {
        name: "Vàng",
        value: "1,959.25",
        high: "1,965.50",
        low: "1,958.05",
        change: "-10.55",
        percent: "-0.54%",
        time: "16:44:45",
        pid: "8830",
      },
      {
        name: "XAU/USD",
        value: "1,954.71",
        high: "1,960.84",
        low: "1,953.59",
        change: "-3.89",
        percent: "-0.20%",
        time: "16:44:40",
        pid: "68",
      },
      {
        name: "Bạc",
        value: "22.622",
        high: "22.797",
        low: "22.610",
        change: "-0.283",
        percent: "-1.24%",
        time: "16:44:03",
        pid: "",
      },
      {
        name: "Đồng",
        value: "3.6168",
        high: "3.6448",
        low: "3.6123",
        change: "-0.0237",
        percent: "-0.65%",
        time: "16:44:08",
        pid: "",
      },
      {
        name: "Platin",
        value: "856.05",
        high: "864.70",
        low: "854.60",
        change: "-6.75",
        percent: "-0.78%",
        time: "16:43:36",
        pid: "",
      },
      {
        name: "Paladi",
        value: "961.78",
        high: "1,003.78",
        low: "951.03",
        change: "-47.32",
        percent: "-4.69%",
        time: "16:44:04",
        pid: "",
      },
      {
        name: "Dầu Thô WTI",
        value: "76.41",
        high: "76.44",
        low: "75.31",
        change: "+0.67",
        percent: "+0.88%",
        time: "16:45:02",
        pid: "8849",
      },
      {
        name: "Dầu Brent",
        value: "80.80",
        high: "81.48",
        low: "79.44",
        change: "+0.79",
        percent: "+0.99%",
        time: "16:43:45",
        pid: "",
      },
      {
        name: "Khí Tự nhiên",
        value: "3.042",
        high: "3.054",
        low: "3.003",
        change: "+0.001",
        percent: "+0.03%",
        time: "16:44:21",
        pid: "",
      },
      {
        name: "Dầu Nhiên liệu",
        value: "2.7540",
        high: "2.7540",
        low: "2.6989",
        change: "+0.0349",
        percent: "+1.28%",
        time: "16:43:45",
        pid: "",
      },
      {
        name: "Xăng RBOB",
        value: "2.1860",
        high: "2.1860",
        low: "2.1539",
        change: "+0.0252",
        percent: "+1.17%",
        time: "16:44:50",
        pid: "",
      },
      {
        name: "Nhôm",
        value: "2,228.00",
        high: "2,247.00",
        low: "2,225.50",
        change: "-14.50",
        percent: "-0.65%",
        time: "16:44:06",
        pid: "",
      },
      {
        name: "Kẽm",
        value: "2,607.00",
        high: "2,621.00",
        low: "2,587.50",
        change: "+4.50",
        percent: "+0.17%",
        time: "16:44:01",
        pid: "956470",
      },
      {
        name: "Ni-ken",
        value: "17,547.00",
        high: "17,686.00",
        low: "17,530.00",
        change: "-266.00",
        percent: "-1.49%",
        time: "16:43:51",
        pid: "",
      },
      {
        name: "Copper",
        value: "8,090.00",
        high: "8,142.00",
        low: "8,082.00",
        change: "-57.00",
        percent: "-0.70%",
        time: "16:43:45",
        pid: "959211",
      },
      {
        name: "Lúa mì Hoa Kỳ",
        value: "577.60",
        high: "581.88",
        low: "575.38",
        change: "-2.40",
        percent: "-0.41%",
        time: "16:43:38",
        pid: "",
      },
      {
        name: "Thóc",
        value: "16.440",
        high: "16.510",
        low: "16.440",
        change: "-0.075",
        percent: "-0.45%",
        time: "08:37:19",
        pid: "",
      },
      {
        name: "Bắp Hoa Kỳ",
        value: "467.88",
        high: "469.00",
        low: "467.12",
        change: "-0.12",
        percent: "-0.03%",
        time: "16:43:25",
        pid: "",
      },
      {
        name: "Nước Cam",
        value: "370.65",
        high: "371.85",
        low: "362.55",
        change: "+20.37",
        percent: "+5.82%",
        time: "02:00:04",
        pid: "",
      },
      {
        name: "Bê",
        value: "174.30",
        high: "180.07",
        low: "174.13",
        change: "-5.10",
        percent: "-2.84%",
        time: "02:04:59",
        pid: "",
      },
      {
        name: "Heo nạc",
        value: "71.47",
        high: "72.50",
        low: "71.10",
        change: "-0.03",
        percent: "-0.03%",
        time: "02:04:57",
        pid: "",
      },
      {
        name: "Bê đực non",
        value: "224.53",
        high: "240.18",
        low: "224.39",
        change: "-6.30",
        percent: "-2.73%",
        time: "04:46:03",
        pid: "",
      },
      {
        name: "Gỗ",
        value: "525.50",
        high: "525.50",
        low: "518.50",
        change: "+10.00",
        percent: "+1.94%",
        time: "03:44:37",
        pid: "",
      },
      {
        name: "Yến mạch",
        value: "350.50",
        high: "350.70",
        low: "348.30",
        change: "-0.20",
        percent: "-0.06%",
        time: "15:09:25",
        pid: "",
      },
    ],
    message: "goods-price list.",
  });
});

//get list company
app.get("/list-company", async function (req, res) {
  let data = await query("SELECT * FROM organization");
  res.send({ error: false, data: data, message: "company list." });
});

//get company info
app.get("/company-info", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query("SELECT * FROM info_company WHERE symbol = ?", [
    symbol,
  ]);
  res.send({ error: false, data: data, message: "company info." });
});

//get list news
app.get("/news", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query("SELECT * FROM news WHERE symbol = ?", [symbol]);
  res.send({ error: false, data: data, message: "news list." });
});

//get gia_heo
app.get("/gia_heo", async function (req, res) {
  let data = await query("SELECT * FROM gia_heo ");
  res.send({ error: false, data: data, message: "gia_heo list." });
});

//get gia_thep
app.get("/gia_thep", async function (req, res) {
  let data = await query("SELECT * FROM gia_thep ");
  res.send({ error: false, data: data, message: "gia_thep list." });
});

//get gia_gao
app.get("/gia_gao", async function (req, res) {
  let data = await query("SELECT * FROM gia_gao ");
  res.send({ error: false, data: data, message: "gia_gao list." });
});

//get gia_ca_tra
app.get("/gia_ca_tra", async function (req, res) {
  let data = await query("SELECT * FROM gia_ca_tra ");
  res.send({ error: false, data: data, message: "gia_ca_tra list." });
});

//get dau_tu_nuoc_ngoai
app.get("/dau_tu_nuoc_ngoai_tinh_thanh", async function (req, res) {
  let data = await query(
    "SELECT stt,thanhPho, `code`, tongVonDangKy , `time`  FROM dau_tu_nuoc_ngoai WHERE YEAR(STR_TO_DATE(CONCAT(time, '_01'), '%Y_%m_%d')) BETWEEN 2018 AND 2024"
  );
  res.send({ error: false, data: data, message: "dau_tu_nuoc_ngoai list." });
});
//get von_dau_tu
app.get("/von_dau_tu_tinh_thanh", async function (req, res) {
  let data = await query("SELECT *  FROM von_dau_tu ");
  res.send({ error: false, data: data, message: "dau_tu_nuoc_ngoai list." });
});

//get gia_phan
app.get("/gia_phan", async function (req, res) {
  let data = await query("SELECT * FROM gia_phan ");
  res.send({ error: false, data: data, message: "gia_phan list." });
});

//get gia_dien
app.get("/gia_dien", async function (req, res) {
  let data = await query("SELECT * FROM gia_dien ");
  res.send({ error: false, data: data, message: "gia_dien list." });
});

//get list financial_analysis
app.get("/financial_analysis", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query(
    "SELECT * FROM financial_analysis WHERE organCode = ?",
    [symbol]
  );
  res.send({ error: false, data: data, message: "financial_analysis list." });
});

//get giaVang
app.get("/giaVang", async function (req, res) {
  let data = await query("SELECT * FROM gold_price ");
  res.send({ error: false, data: data, message: "giaVang list." });
});

//get lai suat
app.get("/lai_suat", async function (req, res) {
  let data = await query("SELECT * FROM lai_suat ");
  res.send({ error: false, data: data, message: "lai_suat list." });
});
app.get("/news-all", async function (req, res) {
  let listPost = await query(
    "SELECT * FROM news_all where (date = ? OR date = ?) ",
    // "SELECT * FROM news_all where url LIKE '%https://baochinhphu.vn%' AND (date = ? OR date = ?) ",
    [
      moment().format("YYYY-MM-DD"),
      moment().subtract(1, "days").format("YYYY-MM-DD"),
    ]
  );

  res.send({
    status: "success",
    data: listPost,
    length: listPost.length,
  });
});

app.get("/news-type", async (req, res) => {
  const { type } = req.query;
  const limit = parseInt(req.query.limit, 12) || 12; // Giá trị mặc định là 10 bản ghi mỗi trang
  const page = parseInt(req.query.page, 10) || 1; // Mặc định là trang số 1
  let tableName = "news_all";
  console.log("type: ", type);
  if (type === "Bất động sản" || type === "Tài chính" || type === "Công nghệ")
    tableName = "news_all_detail";
  if (!type) {
    res.status(400).send("Type parameter is required");
    return;
  }

  // Tính OFFSET dựa trên số trang và giới hạn
  const offset = (page - 1) * limit;

  // Cập nhật câu truy vấn SQL để bao gồm LIMIT và OFFSET
  const sqlQuery = `SELECT * FROM ${tableName} WHERE type = ? AND (date = ? OR date = ?) LIMIT ? OFFSET ? `;
  console.log("sqlQuery: ", sqlQuery);

  // Thực hiện truy vấn với các tham số cập nhật
  const listPostNewsType = await query(
    sqlQuery,
    [
      type,
      moment().format("YYYY-MM-DD"),
      moment().subtract(30, "days").format("YYYY-MM-DD"),
      limit,
      offset,
    ],
    (error, results) => {
      if (error) {
        res.status(500).send("Error retrieving data");
        console.error(error);
        return;
      }
      res.json(results);
    }
  );
  res.send({
    status: "success",
    data: listPostNewsType,
    length: listPostNewsType?.length,
  });
});

const getNewsDetail = async (url) => {
  // Fetch the HTML first and load it into Cheerio
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);
  let type;
  let title;
  let introduction;
  let date;
  let content;
  let sourceUrl;
  let follow;
  switch (true) {
    // Trường hợp URL là của báo Quân đội nhân dân
    case url.includes("https://www.qdnd.vn/"):
      // Lấy tiêu đề (title) từ thẻ h1
      title = $("h1.post-title").text().trim();

      // Lấy phần giới thiệu (introduction) từ thẻ h2 với class post-summary
      introduction = $("h2.logo-online").text().trim();

      // Lấy ngày đăng bài (date) từ phần chứa ngày giờ trong thẻ span
      date = $("span.post-subinfo")
        .text()
        .trim()
        .match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/);
      date = date ? date[0] : "";

      // Clone nội dung bài viết (content) từ thẻ div có class là post-content
      var contentClone = $("div.post-content").clone(); // Sao chép nội dung bài viết
      contentClone.find("table, figure, .related-articles").remove(); // Loại bỏ các phần không cần thiết như bảng, hình ảnh
      content = contentClone.html(); // Lấy nội dung bài viết

      // URL gốc của bài viết
      sourceUrl = url;

      // Nguồn của bài viết
      follow = "Theo Báo Quân đội Nhân dân";

      break;

    case url.includes("https://doisongphapluat.com.vn/"):
      // Lấy tiêu đề từ thẻ <h1>
      title = $("h1.color-black.bold.fs-36").text().trim();

      // Lấy phần giới thiệu từ thẻ <h2> có class là sapo (nếu có)
      introduction = $("h2.fs-20.font-italic.color-black.word-space-1")
        .text()
        .trim();

      // Lấy ngày tháng từ phần <footer> hoặc nội dung văn bản có chứa ngày
      const fullDate = $("footer ul.ul-disc").text().trim();
      const dateMatch1 = fullDate.match(/\d{2}\/\d{2}\/\d{4}/);
      date = dateMatch1 ? dateMatch1[0] : "";

      // Clone phần nội dung bài viết và loại bỏ các quảng cáo hoặc nội dung không cần thiết
      var contentClone = $("div.entry-body, div.edittor-content").clone(); // Sao chép nội dung
      contentClone.find(".ads-item, .related-articles, .ad-690-220").remove(); // Loại bỏ quảng cáo và các phần không cần thiết
      content = contentClone.html();

      // URL gốc của bài viết
      sourceUrl = url;

      // Ghi rõ nguồn
      follow = "Theo Đời sống pháp luật";

      break;

    case url.includes("https://doanhnghiepkinhdoanh.doanhnhanvn.vn"):
      title = $("h2.title").text().trim();
      type = $("div.mb-3 a.badge.mr-2:first").text().trim();
      introduction = $("div.sapo").text().trim();
      const fullText = $("div.mb-3")
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim();
      const dateMatch = fullText.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      date = dateMatch ? dateMatch[0] : "";
      var contentClone = $("div.entry-body").clone(); // Sao chép nội dung để tránh thay đổi DOM gốc
      contentClone.find(".type-2 ").remove(); // Loại bỏ phần tử có class 'zone--related'
      content = contentClone.html();
      sourceUrl = url;
      follow = "Theo Doanh Nghiệp Kinh Doanh";
      break;

    case url.includes("https://baochinhphu.vn"):
      type = $("div.detail-breadcrumb a[data-role='cate-name']").text().trim();
      title = $("h1.detail-title").text().trim();
      const des = $("h2.detail-sapo").text().trim();
      introduction = des.replace("(Chinhphu.vn) - ", "");

      date = $("div.detail-time").text().trim();
      content = $("div.detail-content").html();
      sourceUrl = url;
      follow = "Theo Báo Chính Phủ";

      break;
    case url.includes("https://chatluongvacuocsong.vn"):
      title = $("h1.tit_detail").text().trim();

      const description = $("p.intro_detail").text().trim();
      introduction = description.replace("(CL&CS) - ", "");
      date = $("div.fs-14").text().trim();
      content = $("div.detail-content-clcs").html();

      // ?.replace('<figure class="expNoEdit">', "")
      // ?.replace('gure class="expNoEdit">', "")
      // ?.replace("</figure>", "")
      type = $("span.section-title").html();
      sourceUrl = url;
      follow = "Theo Chất Lượng Cuộc Sống";
      break;
    // case url.includes("https://dautu.kinhtechungkhoan.vn"):
    //   type = $("div.post-meta a.post-cat").text().trim();
    //   title = $("h1.post-title").text().trim();
    //   introduction = $("div.post-desc").text().trim();
    //   date = $("span.format_time").text().trim();
    //   content = $("div.post-content").html();
    //   break;
    case url.includes("https://doanhnhanvn.vn"):
      title = $("h1.detail__title").text().trim();
      introduction = $("div.detail__summary").text().trim();
      const dateTimeText = $("div.detail__time div").text();
      date = dateTimeText.match(/\d{2}:\d{2} \| \d{2}\/\d{2}\/\d{4}/)[0].trim();
      var contentClone = $("div.detail__content").clone(); // Sao chép nội dung để tránh thay đổi DOM gốc
      contentClone.find(".zone--related").remove(); // Loại bỏ phần tử có class 'zone--related'
      content = contentClone.html();
      type = $("div.detail__category a:last").text().trim();
      sourceUrl = url;
      follow = "Theo Doanh Nhân Việt Nam";
      break;
    default:
      console.log("URL not recognized");
      break;
  }

  // let hour = date?.slice(date?.length - 5, date?.length);
  let timeIndex = content?.indexOf(date);

  let contentSlice = content;
  if (timeIndex > -1) {
    contentSlice = contentSlice?.slice(timeIndex + 5, content?.length);
  }

  let thamKhaoThemIndex = contentSlice?.indexOf("Tham khảo thêm");
  let tinLienQuanIndex = contentSlice?.indexOf("Tin liên quan");

  if (thamKhaoThemIndex > -1) {
    contentSlice = contentSlice?.slice(0, thamKhaoThemIndex);
  }
  if (tinLienQuanIndex > -1) {
    contentSlice = contentSlice?.slice(0, tinLienQuanIndex);
  }

  return {
    type,
    title,
    date,
    introduction,
    content: contentSlice,
    sourceUrl,
    follow,
  };
};

app.post("/news-detail", async function (req, res) {
  let url = req.body.url;
  let id = req.body.id;
  let detailNews = {};
  console.log("id: ", id);
  if (!!id && id !== "null") {
    let detailQuery = await query(
      "SELECT * FROM news_all_detail WHERE id = ?",
      [id]
    );
    detailNews = detailQuery?.length > 0 ? detailQuery[0] : {};
  } else {
    detailNews = await getNewsDetail(url);
  }
  res.send({ error: false, data: detailNews, message: "news detail." });
});

//get lai suat online
app.get("/lai_suat_online", async function (req, res) {
  let data = await query("SELECT * FROM lai_suat_online ");
  res.send({ error: false, data: data, message: "lai_suat_online list." });
});

//get top_gdnn_rong_ban
app.get("/top_gdnn_rong_ban/:type", async function (req, res) {
  let type = req.params.type;
  try {
    let data = await axios.get(
      `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=SALE&exchange=${type === "hose" ? "HSX" : "HNX"
      }&period=oneDay&numberOfItem=`
    );
    res.send({
      error: false,
      // data: [],
      data: data?.data?.result,
      message: "top_gdnn_rong_mua list.",
    });
    // await axios.get(
    //   `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=SALE&exchange=${
    //     type === "hose" ? "HSX" : "HNX"
    //   }&period=oneDay&numberOfItem=`
    // );
    // let data = await query(`SELECT * FROM top_gdnn_rong_ban_${type} `);
    // let body = [
    //   {
    //     text: `NETFOREIGN_${type === "hose" ? "HSX" : "HNX"}_VALUE_1D_BUY`,
    //     cachedTime: null,
    //   },
    //   {
    //     text: `NETFOREIGN_${type === "hose" ? "HSX" : "HNX"}_VALUE_1D_SALE`,
    //     cachedTime: null,
    //   },
    // ];
    // const apiResponse = await axios.post(
    //   `https://fwtapi2.fialda.com/api/services/app/Stock/GetMarketAnalysises`,
    //   body
    // ); // Your HTML response goes here
    // const response = apiResponse?.data?.result;
    // let netForeignBuy = response?.NETFOREIGN_HSX_VOL_1D_BUY?.data;
    // let netForeignSale = response?.NETFOREIGN_HSX_VOL_1D_SALE?.data;
    // res.send({
    //   error: false,
    //   // data: data?.data?.result,
    //   data: netForeignBuy,
    //   message: "top_gdnn_rong_ban list.",
    // });
  } catch (error) {
    // let data = await query(`SELECT * FROM top_gdnn_rong_ban_${type} `);
    res.send({
      error: true,
      data: [],
      message: "top_gdnn_rong_ban list.",
    });
  }

  // let data = await axios.get(
  //   `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=SALE&exchange=${
  //     type === "hose" ? "HSX" : "HNX"
  //   }&period=oneDay&numberOfItem=`
  // );
  // // let data = await query(`SELECT * FROM top_gdnn_rong_ban_${type} `);
  // res.send({
  //   error: false,
  //   data: data?.data?.result,
  //   message: "top_gdnn_rong_ban list.",
  // });
});

//get top_gdnn_rong_mua
app.get("/top_gdnn_rong_mua/:type", async function (req, res) {
  let type = req.params.type;
  try {
    let data = await axios.get(
      `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=BUY&exchange=${type === "hose" ? "HSX" : "HNX"
      }&period=oneDay&numberOfItem=`
    );
    res.send({
      error: false,
      // data: [],
      data: data?.data?.result,
      message: "top_gdnn_rong_mua list.",
    });
  } catch (error) {
    res.send({
      error: true,
      data: [],
      message: "top_gdnn_rong_mua list.",
    });
  }
  // let data = await axios.get(
  //   `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=BUY&exchange=${
  //     type === "hose" ? "HSX" : "HNX"
  //   }&period=oneDay&numberOfItem=`
  // );
  // res.send({
  //   error: false,
  //   data: data?.data?.result,
  //   message: "top_gdnn_rong_mua list.",
  // });
});

// //get chỉ số chung công ty
// app.get("/statistics/company/stock-price", async function (req, res) {
//   let { symbol, page, pageSize, fromDate, toDate } = req.query;
//   if (!symbol) {
//     return res.send({ error: true, data: {}, message: "missing symbol" });
//   }
//   let data = await axios.get(
//     `https://iboard-api.ssi.com.vn/statistics/company/stock-price?symbol=${symbol}&page=${page}&pageSize=${pageSize}&fromDate=${fromDate}&toDate=${toDate}`
//   );
//   res.send({
//     error: false,
//     data: data?.data,
//     message: "statistics/company/stock-price list.",
//   });
// });

//get list reports
app.get("/reports", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query("SELECT * FROM reports WHERE organCode = ?", [symbol]);
  res.send({ error: false, data: data, message: "reports list." });
});

//filter full
app.post("/filter-data", async function (req, res) {
  let object = req.body;
  let dataResponse = await axios.post(
    // "https://dautubenvung-721299848503.us-central1.run.app/filter-data",
    "https://fwtapi1.fialda.com/api/services/app/Stock/GetDataByFilter",
    object
  );
  let data = dataResponse?.data;
  // let data = dataResponse?.data?.data;
  res.send({ error: false, data: data, message: "filter list." });
});

//filter new
app.post("/filter-data-new", async function (req, res) {
  let object = req.body;
  let objectStringify = JSON.stringify(object);
  let response = await fetch(
    "https://fiin-tools.ssi.com.vn/Screener/GetScreenerItems",
    {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "x-fiin-key": "KEY",
        "x-fiin-seed": "SEED",
        "x-fiin-user-id": "ID",
        "x-fiin-user-token":
          "131,86,205,104,139,11,97,119,219,172,158,59,231,70,153,222,34,251,171,147,197,227,151,118,92,135,193,174,198,15,238,19,187,170,180,60,149,92,123,58,238,241,205,171,32,172,220,51,49,3,50,155,236,103,206,123,26,1,176,114,226,16,50,48,232,125,17,77,205,211,19,186,54,61,178,230,62,179,208,210,135,188,175,172,46,206,49,176,237,225,152,193,42,178,82,133,252,84,32,250,243,227,183,115,239,155,44,161,179,130,190,150,20,133,134,244,36,233,47,75,150,153,76,177,156,23,25,165,192,111,89,112,44,99,193,6,174,66,185,244,128,184,63,207,61,190,114,155,79,245,236,197,85,254,104,9,58,163,90,35,93,218,247,35,248,94,176,42,228,10,70,185,236,143,211,104,39,152,45,234,215,34,167,30,128,228,211,149,80,224,45,57,95,240,41,128,141,228,76,38,81,187,125,47,49,169,9,147,16,81,101,69,239,5,194,72,84,60,75,36,225,211,127,178,112,235,196,90,63,78,127,209,103,31,103,180,95,14,128,144,129,64,89,226,39,25,84,158,184,20,51,54,25,179,159,217",
        Referer: "https://iboard.ssi.com.vn/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: objectStringify,
      method: "POST",
    }
  );
  let data = await response.json();
  let dataFilter = data?.items;
  res.send({
    error: false,
    // data: [],
    data,
    message: "filter list.",
  });
});

//get gia xang dau
app.get("/gia_xang_dau", async function (req, res) {
  let data = await query("SELECT * FROM gia_xang_dau ");
  res.send({ error: false, data: data, message: "gia_xang_dau list." });
});

//get ty gia ngoai te
app.get("/ty_gia_ngoai_te", async function (req, res) {
  let data = await query("SELECT * FROM ty_gia_ngoai_te ");
  res.send({ error: false, data: data, message: "ty_gia_ngoai_te list." });
});

const downsampleData = (data, targetCount) => {
  if (data.length <= targetCount) {
    return data; // Nếu số lượng dữ liệu ít hơn hoặc bằng targetCount, trả về toàn bộ dữ liệu
  }

  const downsampled = [];
  const step = Math.floor(data.length / targetCount); // Tính bước nhảy để lấy dữ liệu

  for (let i = 0; i < targetCount; i++) {
    downsampled.push(data[i * step]); // Lấy phần tử tại chỉ số i * step
  }
  //push last item into final data
  downsampled.push(data[data.length - 1]);
  return downsampled;
};

app.get("/thanh_khoan_data/current/:type", async function (req, res) {
  const type = req.params.type;
  let sql = `SELECT * FROM thanh_khoan_data WHERE date_type = 'current' AND type = '${type}'`;
  // Or use date filtering if you prefer
  try {
    let data = await query(sql);
    data = downsampleData(data, 100); // Target 1000 points
    res.send({
      error: false,
      data: data,
      message: "Current thanh_khoan data list.",
    });
  } catch (error) {
    res.status(500).send({
      error: true,
      message: "Error fetching current thanh_khoan data: " + error.message,
    });
  }
});

app.get("/thanh_khoan_data/historical/:type", async function (req, res) {
  const type = req.params.type;

  let sql = `SELECT * FROM thanh_khoan_data WHERE date_type = 'historical' AND type = '${type}'`;
  // Or date range check for historical
  try {
    let data = await query(sql);
    data = downsampleData(data, 100); // Target 1000 points
    res.send({
      error: false,
      data: data,
      message: "Historical thanh_khoan data list.",
    });
  } catch (error) {
    res.status(500).send({
      error: true,
      message: "Error fetching historical thanh_khoan data: " + error.message,
    });
  }
});

app.get("/report-chart", async function (req, res) {
  let { symbol } = req.query;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }

  let dataCanDoiKeToan = [];
  let dataLuuChuyenTienTe = [];
  let dataKetQuaKinhDoanh = [];

  let queryCommand = `SELECT * FROM can_doi_ke_toan WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
  let result = await query(queryCommand);
  dataCanDoiKeToan = [...result];
  let queryInfo = `SELECT * FROM info_company WHERE symbol = '${symbol}'`;
  let resultQuery = await query(queryInfo);
  let currentInfo = resultQuery[0];
  let superSector = currentInfo?.superSector;

  let dataMapCanDoiKeToan = [];
  let dataMapKetQuaKinhDoanh = [];
  let dataMapLuuChuyenTienTe = [];

  if (superSector === "Bảo hiểm") {
    dataMapCanDoiKeToan = result.map((item, index) => {
      let dauTuTaiChinhNganHanYoy = 0;
      let gap = item.quarterReport !== 5 ? -5 : -1;

      let dauTuTaiChinhNganHanYoYCurrent = result[index]?.bsa5;
      let dauTuTaiChinhNganHanYoYLastYear = result[index + gap]?.bsa5;
      dauTuTaiChinhNganHanYoy =
        ((dauTuTaiChinhNganHanYoYCurrent - dauTuTaiChinhNganHanYoYLastYear) /
          dauTuTaiChinhNganHanYoYLastYear) *
        100;
      //lam tron 2 chu so thap phan
      dauTuTaiChinhNganHanYoy = Math.round(dauTuTaiChinhNganHanYoy * 100) / 100;

      return {
        ...item,
        taiSan: {
          tienVaTuongDuongTien: item.bsa2,
          dauTuNganHan: item.bsa5,
          dauTuTaiChinhNganHanYoy,
          dauTuDaiHan: item.bsa43,
          cacKhoanPhaiThu: item.bsa8,
          hangTonKhoRong: item.bsa15,
          taiSanNganHanKhac: item.bsa18,
          taiSanTaiBaoHiem: item.bsi192,
          phaiThuDaiHan: item.bsa24,
          taiSanCoDinh: item.bsa29,
          batDongSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          cacKhoanDauTuTaiChinhDaiHan: item.bsa43,
          taiSanDaiHanKhac: item.bsa49,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonChuSoHuu: item.bsa78,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });
  } else if (superSector === "Ngân hàng") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          tienMatVangBacDaQuy: item.bsa2,
          tienGuiTaiNganHangNhaNuocVietNam: item.bsb97,
          tienGuiTaiCacTCTDKhacVaChoVayCacTCTDKhac: item.bsb98,
          chungKhoanKinhDoanh: item.bsb99,
          cacCongCuTaiChinhPhaiSinhVaCacTaiSanTaiChinhKhac: item.bsb102,
          choVayKhachHang: item.bsb103,
          chungKhoanDauTu: item.bsb106,
          gopVonDauTuDaiHan: item.bsa43,
          taiSanCoDinh: item.bsa29,
          giaTriRongTaiSanDauTu: item.bsa40,
          taiSanCoKhac: item.bsb110,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
        nguonVon: {
          loiIchCuaCoDongThieuSo: item.bsa95,
          loiNhuanChuaPhanPhoi: item.bsa90,
          chenhLechDanhGiaLaiTaiSan: item.bsa84,
          chenhLechTiGiaHoiDoai: item.bsa85,
          quyCuaToChucTinDung: item.bsb121,
          vonCuaToChucTinDung: item.bsb118,
          cacKhoanNoKhac: item.bsb117,
          phatHanhGiayToCoGia: item.bsb116,
          vonTaiTroUyThacDauTuCuaChinhPhuVaCacToChucTinDungKhac: item.bsb115,
          cacCongCuTaiChinhPhaiSinhVaCacKhoanNoTaiChinhKhac: item.bsb114,
          cacKhoanNoChinhPhuVaNHNNVietNam: item.bsb111,
          tienGuiCuaKhacHang: item.bsb113,
          tienGuiVaVayCacToChucTinDungKhac: item.bsb112,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });
  } else if (superSector === "Dịch vụ tài chính") {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          taiSanTaiChinhNganHan: item.bss214,
          taiSanLuuDongKhac: item.bsa18,
          taiSanTaiChinhDaiHan: item.bsa43,
          taiSanCoDinh: item.bsa29,
          giaTriRongBatDongSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          taiSanDaiHanKhac: item.bsa49,
          tienVaTuongDuongTien: item.bsa2,
          giaTriThuanDauTuTaiSanTaiChinhNganHan: item.bsa5,
          tongCacKhoanPhaiThu: item.bsa8,
          hangTonKhoRong: item.bsa15,
          dauTuDaiHan: item.bsa43,

          quarter: item.quarterReport,
          year: item.yearReport,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonVaCacQuy: item.bsa78,
          loiIchCuaCoDongThieuSo: item.bsa95,

          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });
  } else {
    dataMapCanDoiKeToan = result.map((item) => {
      return {
        ...item,
        taiSan: {
          tienVaTuongDuongTien: item.bsa2,
          giaTriThuanDauTuNganHan: item.bsa5,
          dauTuDaiHan: item.bsa43,
          cacKhoanPhaiThu: item.bsa8,
          hangTonKhoRong: item.bsa15,
          taiSanLuuDongKhac: item.bsa18,
          phaiThuDaiHan: item.bsa24,
          taiSanCoDinh: item.bsa29,
          giaTriRongTaiSanDauTu: item.bsa40,
          taiSanDoDangDaiHan: item.bsa163,
          dauTuDaiHan: item.bsa43,
          taiSanDaiHanKhac: item.bsa49,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
        nguonVon: {
          noNganHan: item.bsa55,
          noDaiHan: item.bsa67,
          vonVaCacQuy: item.bsa78,
          loiIchCuaCoDongThieuSo: item.bsa95,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });
  }

  queryCommand = `SELECT * FROM luu_chuyen_tien_te WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
  result = await query(queryCommand);
  dataLuuChuyenTienTe = [...result];
  dataMapLuuChuyenTienTe = result.map((item, index) => {
    return {
      ...item,
      luuChuyenTien: {
        LCTTTuHoatDongDauTu: item.cfa26,
        LCTTTuaHoatDongTaiChinh: item.cfa34,
        LCTTTuHoatDongKinhDoanh: item.cfa18,
        tienVaTuongDuongCuoiKi: item.cfa38,
        quarter: item.quarterReport,
        year: item.yearReport,
      },
    };
  });

  queryCommand = `SELECT * FROM ket_qua_kinh_doanh WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
  result = await query(queryCommand);
  dataKetQuaKinhDoanh = [...result];
  dataMapKetQuaKinhDoanh = result.map((item, index) => {
    let doanhThuThuanYoy = 0;
    let loiNhuanTruocThueYoy = 0;
    let loiNhuanSauThueYoy = 0;
    let loiNhuanSauThueChuSoHuuYoy = 0;
    let chiPhiDuPhongRuiRoTinDungYoy = 0;
    let doanhThuPhiBaoHiemYoy = 0;
    let thuNhapLaiVaCacKhoanTuongTuYoy = 0;

    let gap = item.quarterReport !== 5 ? -5 : -1;
    if (
      index + gap <= result.length - 1 &&
      result[index + gap]?.quarterReport === item.quarterReport &&
      result[index + gap]?.yearReport === item.yearReport - 1
    ) {
      let doanhThuThuanCurrent = result[index].isa3;
      let doanhThuThuanLastYear = result[index + gap].isa3;
      doanhThuThuanYoy =
        ((doanhThuThuanCurrent - doanhThuThuanLastYear) /
          doanhThuThuanLastYear) *
        100;
      //lam tron 2 chu so thap phan
      doanhThuThuanYoy = Math.round(doanhThuThuanYoy * 100) / 100;

      let loiNhuanTruocThueCurrent = result[index].isa16;
      let loiNhuanTruocThueLastYear = result[index + gap].isa16;
      loiNhuanTruocThueYoy =
        ((loiNhuanTruocThueCurrent - loiNhuanTruocThueLastYear) /
          loiNhuanTruocThueLastYear) *
        100;
      //lam tron 2 chu so thap phan
      loiNhuanTruocThueYoy = Math.round(loiNhuanTruocThueYoy * 100) / 100;

      let loiNhuanSauThueCurrent = result[index].isa20;
      let loiNhuanSauThueLastYear = result[index + gap].isa20;
      loiNhuanSauThueYoy =
        ((loiNhuanSauThueCurrent - loiNhuanSauThueLastYear) /
          loiNhuanSauThueLastYear) *
        100;

      let loiNhuanSauThueChuSoHuuCurrent = result[index].isa22;
      let loiNhuanSauThueChuSoHuuLastYear = result[index + gap].isa22;
      loiNhuanSauThueChuSoHuuYoy =
        ((loiNhuanSauThueChuSoHuuCurrent - loiNhuanSauThueChuSoHuuLastYear) /
          loiNhuanSauThueChuSoHuuLastYear) *
        100;
      //lam tron 2 chu so thap phan
      loiNhuanSauThueChuSoHuuYoy =
        Math.round(loiNhuanSauThueChuSoHuuYoy * 100) / 100;

      let chiPhiDuPhongRuiRoTinDungCurrent = result[index].isa41;
      let chiPhiDuPhongRuiRoTinDungLastYear = result[index + gap].isa41;
      chiPhiDuPhongRuiRoTinDungYoy =
        ((chiPhiDuPhongRuiRoTinDungCurrent -
          chiPhiDuPhongRuiRoTinDungLastYear) /
          chiPhiDuPhongRuiRoTinDungLastYear) *
        100;
      //lam tron 2 chu so thap phan
      chiPhiDuPhongRuiRoTinDungYoy =
        Math.round(chiPhiDuPhongRuiRoTinDungYoy * 100) / 100;

      let doanhThuPhiBaoHiemCurrent = result[index].isi103;
      let doanhThuPhiBaoHiemLastYear = result[index + gap].isi103;
      doanhThuPhiBaoHiemYoy =
        ((doanhThuPhiBaoHiemCurrent - doanhThuPhiBaoHiemLastYear) /
          doanhThuPhiBaoHiemLastYear) *
        100;
      //lam tron 2 chu so thap phan
      doanhThuPhiBaoHiemYoy = Math.round(doanhThuPhiBaoHiemYoy * 100) / 100;

      let thuNhapLaiVaCacKhoanTuongTuCurrent = result[index].isb25;
      let thuNhapLaiVaCacKhoanTuongTuLastYear = result[index + gap].isb25;
      thuNhapLaiVaCacKhoanTuongTuYoy =
        ((thuNhapLaiVaCacKhoanTuongTuCurrent -
          thuNhapLaiVaCacKhoanTuongTuLastYear) /
          thuNhapLaiVaCacKhoanTuongTuLastYear) *
        100;
      //lam tron 2 chu so thap phan
      thuNhapLaiVaCacKhoanTuongTuYoy =
        Math.round(thuNhapLaiVaCacKhoanTuongTuYoy * 100) / 100;
    }
    return {
      ...item,
      doanhThuThuan: {
        doanhThuThuan: item.isa3,
        doanhThuHoatDongTaiChinh: item?.iss141,
        doanhThuThuanYoY: doanhThuThuanYoy,
        quarter: item.quarterReport,
        year: item.yearReport,
      },
      coCauLoiNhuanTruocThue: {
        loiNhuanKhac: item.isa14,
        laiLoTuCongTyLDLK: item.isa102,
        loiNhuanTaiChinh: item.isa15,
        loiNhuanThuanTuHDKDChinh: item.ebit,
        loiNhuanTruocThueYOY: loiNhuanTruocThueYoy,
        quarter: item.quarterReport,
        year: item.yearReport,
      },
      loiNhuanSauThue: {
        loiNhuanSauThue: item.isa20,
        loiNhuanSauThueYOY: loiNhuanSauThueYoy,
        loiNhuanSauThueChuSoHuu: item?.isa22,
        loiNhuanSauThueChuSoHuuYOY: loiNhuanSauThueChuSoHuuYoy,
        chiPhiDuPhongRuiRoTinDung: item?.isa41,
        chiPhiDuPhongRuiRoTinDungYOY: chiPhiDuPhongRuiRoTinDungYoy,
        doanhThuPhiBaoHiem: item?.isi103,
        doanhThuPhiBaoHiemYoy: doanhThuPhiBaoHiemYoy,
        thuNhapLaiVaCacKhoanTuongTu: item?.isb25,
        thuNhapLaiVaCacKhoanTuongTuYoy: thuNhapLaiVaCacKhoanTuongTuYoy,

        quarter: item.quarterReport,
        year: item.yearReport,
      },
    };
  });

  let dataMapKetQuaKinhDoanhQuarter = dataMapKetQuaKinhDoanh.filter(
    (item) => item.quarterReport !== 5
  );
  let dataMapCanDoiKeToanQuarter = dataMapCanDoiKeToan.filter(
    (item) => item.quarterReport !== 5
  );
  let dataMapLuuChuyenTienTeQuarter = dataMapLuuChuyenTienTe.filter(
    (item) => item.quarterReport !== 5
  );
  let dataMapKetQuaKinhDoanhYear = dataMapKetQuaKinhDoanh.filter(
    (item) => item.quarterReport === 5
  );
  let dataMapCanDoiKeToanYear = dataMapCanDoiKeToan.filter(
    (item) => item.quarterReport === 5
  );
  let dataMapLuuChuyenTienTeYear = dataMapLuuChuyenTienTe.filter(
    (item) => item.quarterReport === 5
  );

  res.send({
    error: false,
    data: {
      superSector,
      // luuChuyenTien: dataLuuChuyenTienTe,
      // canDoiKeToan: dataCanDoiKeToan,
      // ketQuaKinhDoanh: dataKetQuaKinhDoanh,
      quarter: {
        luuChuyenTien: dataLuuChuyenTienTe.filter(
          (item) => item.quarterReport !== 5
        ),
        canDoiKeToan: dataCanDoiKeToan.filter(
          (item) => item.quarterReport !== 5
        ),
        ketQuaKinhDoanh: dataKetQuaKinhDoanh.filter(
          (item) => item.quarterReport !== 5
        ),
        taiSan: dataMapCanDoiKeToanQuarter.map((item) => item.taiSan),
        nguonVon: dataMapCanDoiKeToanQuarter.map((item) => item.nguonVon),
        luuChuyenTien: dataMapLuuChuyenTienTeQuarter.map(
          (item) => item.luuChuyenTien
        ),
        doanhThuThuan: dataMapKetQuaKinhDoanhQuarter.map(
          (item) => item.doanhThuThuan
        ),
        coCauLoiNhuanTruocThue: dataMapKetQuaKinhDoanhQuarter.map(
          (item) => item.coCauLoiNhuanTruocThue
        ),
        loiNhuanSauThue: dataMapKetQuaKinhDoanhQuarter.map(
          (item) => item.loiNhuanSauThue
        ),
      },
      year: {
        luuChuyenTien: dataLuuChuyenTienTe.filter(
          (item) => item.quarterReport === 5
        ),
        canDoiKeToan: dataCanDoiKeToan.filter(
          (item) => item.quarterReport === 5
        ),
        ketQuaKinhDoanh: dataKetQuaKinhDoanh.filter(
          (item) => item.quarterReport === 5
        ),
        taiSan: dataMapCanDoiKeToanYear.map((item) => item.taiSan),
        nguonVon: dataMapCanDoiKeToanYear.map((item) => item.nguonVon),
        luuChuyenTien: dataMapLuuChuyenTienTeYear.map(
          (item) => item.luuChuyenTien
        ),
        doanhThuThuan: dataMapKetQuaKinhDoanhYear.map(
          (item) => item.doanhThuThuan
        ),
        coCauLoiNhuanTruocThue: dataMapKetQuaKinhDoanhYear.map(
          (item) => item.coCauLoiNhuanTruocThue
        ),
        loiNhuanSauThue: dataMapKetQuaKinhDoanhYear.map(
          (item) => item.loiNhuanSauThue
        ),
      },
    },
    message: "reports list.",
  });
});

app.get("/sub-companies", async function (req, res) {
  const { symbol } = req.query;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  queryCommand = `SELECT * FROM sub_company WHERE parentSymbol = '${symbol}'`;
  result = await query(queryCommand);
  res.send({
    code: "SUCCESS",
    message: "Get sub companies data success",
    data: result,
  });
});

//get list leadership
app.get("/leadership", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query("SELECT * FROM leadership WHERE symbol = ?", [symbol]);
  res.send({
    code: "SUCCESS",
    message: "Get leadership data success",
    data: data,
  });
});

//get company statistic
app.get("/company-statistic", async function (req, res) {
  let symbol = req?.query?.symbol;
  if (!symbol) {
    return res.send({ error: true, data: {}, message: "missing symbol" });
  }
  let data = await query("SELECT * FROM company_statistic WHERE symbol = ?", [
    symbol,
  ]);
  res.send({
    code: "SUCCESS",
    message: "Get company statistics data success",
    data: data.length > 0 ? data[0] : {},
  });
});

app.post("/nhom-nganh", async function (req, res) {
  let symbols = req?.body?.symbols;
  //get nhóm ngành từ bảng info_company trường superSector
  let queryCommand = `SELECT * FROM info_company WHERE symbol IN (${symbols
    ?.map((item) => `'${item}'`)
    ?.join(",")})`;
  let result = await query(queryCommand);
  res.send({
    code: "SUCCESS",
    message: "Get nhóm ngành data success",
    data: result,
  });
});

// Lấy Dữ liệu từ Bảng my_filter Theo userId
app.get("/get-my-filter", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const filters = await query("SELECT * FROM `my_filter` WHERE userId = ?", [
      userId,
    ]);
    res.send({ success: true, data: filters });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//Thêm Mới Bộ Lọc
app.post("/add-my-filter", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { listFilter } = req.body;
  if (!userId || !Array.isArray(listFilter)) {
    return res
      .status(400)
      .send({ error: true, message: "Invalid data format" });
  }

  try {
    // Xóa các bộ lọc cũ
    await query("DELETE FROM `my_filter` WHERE userId = ?", [userId]);

    // Thêm các bộ lọc mới
    for (const filter of listFilter) {
      await query(
        "INSERT INTO `my_filter` (userId, label, isMultiple) VALUES (?, ?, ?)",
        [userId, filter.label, filter.isMultiple]
      );
    }

    res.send({ success: true, message: "Filters added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//Cập Nhật Bộ Lọc
app.put("/update-my-filter", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { listFilter } = req.body;
  if (!userId || !Array.isArray(listFilter)) {
    return res
      .status(400)
      .send({ error: true, message: "Invalid data format" });
  }

  try {
    // Xóa các bộ lọc cũ
    await query("DELETE FROM `my_filter` WHERE userId = ?", [userId]);

    // Thêm các bộ lọc mới
    for (const filter of listFilter) {
      await query(
        "INSERT INTO `my_filter` (userId, label, isMultiple) VALUES (?, ?, ?)",
        [userId, filter.label, filter.isMultiple]
      );
    }

    res.send({ success: true, message: "Filters updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//get config filter
app.get("/get-config-filter", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const filters = await axios.get(
      "https://api.finpath.vn/api/signals?type=&group=&topMarketCap=&valueAvg5Session=&exchange=&watchlistIds=&pageSize=23&page=1&loadPoint=false&mode=custom&q=&sector=",
      { httpsAgent }
    );
    let data = filters?.data?.data?.signals;

    let dataGroup = groupBy(data, "group");
    res.send({ success: true, data: dataGroup });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//data vĩ mô
// app.get("/data-vi-mo", async function (req, res) {
//   let nganhSymbol = req?.query?.nganhSymbol;
//   if (!symbol) {
//     return res.send({ error: true, data: {}, message: "missing symbol" });
//   }
//   let data = await query("SELECT * FROM data_vi_mo WHERE symbol = ?", [
//     symbol,
//   ]);
//   res.send({  "code": "SUCCESS",
//   "message": "Get data vĩ mô data success", data: data.length > 0 ? data[0] : {}});
// })

//get news
app.get("/get-news", async function (req, res) {
  try {
    const response = await axios.get("https://nguoiquansat.vn/");
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];

    $("ul li").each((index, element) => {
      const titleElement = $(element).find(".b-grid__title a");
      const title = titleElement.text().trim();
      const href = titleElement.attr("href");
      const thumbnailUrl = $(element).find(".b-grid__img img").attr("src");
      const descElement = $(element).find(".b-grid__desc");
      const description =
        descElement.length > 0 ? descElement.text().trim() : "";

      // Skip the post if title, href, or thumbnailUrl is empty
      if (title !== "" && href !== "" && thumbnailUrl !== "") {
        posts.push({
          title,
          href,
          thumbnailUrl,
          description,
        });
      }
    });

    res.send({ error: false, data: posts, message: "news list." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

const getListPost = async (sourceUrl) => {
  const response = await axios.get(sourceUrl);
  const html = response.data;
  const $ = cheerio.load(html);

  //   let listPost = [];
  let promises = [];

  try {
    switch (sourceUrl) {
      case "https://baochinhphu.vn":
        $(".box-focus-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".home__sfw-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item-top").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".home-box-related-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-focus-item-sm").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });

        $(".box-item-sub-link").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a").text().trim();
              let url = $(element).find("a").attr("href");
              //   let image = $(element).find("img").attr("src");
              if (
                url.includes("en.baochinhphu.vn") ||
                url.includes("cn.baochinhphu.vn") ||
                url.includes("media.chinhphu.vn")
              ) {
                resolve();
              } else {
                const responseDetail = await axios.get(`${sourceUrl}${url}`);
                const htmlDetail = responseDetail.data;
                const $Detail = cheerio.load(htmlDetail);
                let image = $Detail(".detail-content")
                  ?.find("img")
                  ?.attr("src");
                if (!image) {
                  image = $Detail(".containe-777")?.find("img")?.attr("src");
                }
                let time = $Detail(".detail-time")
                  ?.text()
                  ?.trim()
                  ?.replaceAll("\n", "")
                  ?.replace(/\s+/g, " ");
                if (time === "") {
                  time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
                }
                let description = $Detail(".detail-sapo")?.text()?.trim();
                if (description === "") {
                  description = $Detail(".list__rf-sapo")?.text()?.trim();
                }
                listPost.push({
                  title,
                  url: `${sourceUrl}${url}`,
                  image,
                  time,
                  description,
                });
                resolve();
              }
            })
          );
        });
        break;
      case "https://chatluongvacuocsong.vn":
        $(".section-news-main").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".card-title").text().trim();
              let url = $(element).find(".card-title > a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find(".px-1").text().trim();
              let description = $(element).find("p.fix-text3").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".mini-news_item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".font-weight-bold").text().trim();
              let url = $(element).find(".font-weight-bold > a").attr("href");
              //   let image = $(element).find("img").attr("src");
              //   let time = $(element).find(".px-1").text().trim();
              //   let description = $(element).find("p.fix-text3").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: null,
                  time: null,
                  description: null,
                });
                resolve();
              }
            })
          );
        });
        $(".section-news-list > div > div").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("h2").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".px-1").text().trim();
              // let description = $(element).find("p.fix-text3").text().trim();
              listPost.push({
                title,
                url,
                image,
                time: null,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      case "https://dautu.kinhtechungkhoan.vn":
        $(".article-title").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".article-title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".time").text().trim();
              let description = $(element).find(".article-desc").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: image ? image : null,
                  time: null,
                  description: description ? description : null,
                });
                resolve();
              }
            })
          );
        });
        $(".article").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".article-title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              // let time = $(element).find(".time").text().trim();
              // let description = $(element).find(".article-desc").text().trim();
              if (!title || !url) {
                resolve();
              } else {
                listPost.push({
                  title,
                  url,
                  image: image ? image : null,
                  time: null,
                  description: null,
                });
                resolve();
              }
            })
          );
        });
        break;
      case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn":
        $(".position-relative").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a.title-link").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              let description = $(element).find(".sapo").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".news-lg").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".text-secondary").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              let description = $(element).find(".m-0").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description,
              });
              resolve();
            })
          );
        });
        $(".small-item").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find("a.text-secondary").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("small").text().trim();
              //   let description = $(element).find(".sapo").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      case "https://doanhnhanvn.vn":
        $(".story--highlight").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".story__title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("time").text().trim();
              // let description = $(element).find("p").text().trim();
              listPost.push({
                title,
                url,
                image,
                time,
                description: null,
              });
              resolve();
            })
          );
        });
        $(".story").each((index, element) => {
          promises.push(
            new Promise(async (resolve) => {
              let title = $(element).find(".story__title > a").text().trim();
              let url = $(element).find("a").attr("href");
              let image = $(element).find("img").attr("src");
              let time = $(element).find("time").text().trim();
              // let description = $(element).find("p").text().trim();
              listPost.push({
                title,
                url,
                image,
                time: time ? time : null,
                description: null,
              });
              resolve();
            })
          );
        });
        break;
      default:
        break;
    }
  } catch (error) {
    console.log("error: ");
  }

  // Wait for all promises to resolve
  //   Promise.all(promises).then(() => {
  //   });
};

// app.get("/news-all", async function (req, res) {
//   let sourceUrl = "https://baochinhphu.vn";
//   const response = await axios.get(sourceUrl);
//   const html = response.data;
//   const $ = cheerio.load(html);

//   let listPost = [];
//   let promises = [];

//   try {
//     switch (sourceUrl) {
//       case "https://baochinhphu.vn":
//         $(".box-focus-item").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".home__sfw-item").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".box-item-top").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".home-box-related-item").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".box-focus-item-sm").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".box-item").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });

//         $(".box-item-sub-link").each((index, element) => {
//           promises.push(
//             new Promise(async (resolve) => {
//               let title = $(element).find("a").text().trim();
//               let url = $(element).find("a").attr("href");
//               //   let image = $(element).find("img").attr("src");
//               if (
//                 url.includes("en.baochinhphu.vn") ||
//                 url.includes("cn.baochinhphu.vn") ||
//                 url.includes("media.chinhphu.vn")
//               ) {
//                 resolve();
//               } else {
//                 const responseDetail = await axios.get(`${sourceUrl}${url}`);
//                 const htmlDetail = responseDetail.data;
//                 const $Detail = cheerio.load(htmlDetail);
//                 let image = $Detail(".detail-content")
//                   ?.find("img")
//                   ?.attr("src");
//                 if (!image) {
//                   image = $Detail(".containe-777")?.find("img")?.attr("src");
//                 }
//                 let time = $Detail(".detail-time")
//                   ?.text()
//                   ?.trim()
//                   ?.replaceAll("\n", "")
//                   ?.replace(/\s+/g, " ");
//                 if (time === "") {
//                   time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
//                 }
//                 let description = $Detail(".detail-sapo")?.text()?.trim();
//                 if (description === "") {
//                   description = $Detail(".list__rf-sapo")?.text()?.trim();
//                 }
//                 listPost.push({
//                   title,
//                   url: `${sourceUrl}${url}`,
//                   image,
//                   time,
//                   description,
//                 });
//                 resolve();
//               }
//             })
//           );
//         });
//         break;
//       case "https://vietnamfinance.vn/":
//         $(".articles__large").each((index, element) => {
//           let title = $(element).find(".article__content>a").text().trim();
//           let url = $(element).find("a").attr("href");
//           let image = $(element).find("img").attr("src");
//           let description = $(element).find(".article__des>p").text().trim();
//           listPost.push({
//             title,
//             url,
//             image,
//             time: null,
//             description,
//           });
//         });
//         break;
//       default:
//         break;
//     }
//   } catch (error) {
//     console.log("error: ");
//   }

//   // Wait for all promises to resolve
//   Promise.all(promises).then(() => {
//     listPost = listPost?.map((item, index) => {
//       return {
//         title: item?.title,
//         href: item?.url,
//         thumbnailUrl: item?.image,
//         description: item?.description,
//         time: item?.time,
//       };
//     });

//     res.send({
//       error: false,
//       data: listPost,
//       length: listPost?.length,
//       message: "news list.",
//     });
//   });
// });

//FILTER
app.post("/filter", async function (req, res) {
  let data = req.body.data;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  let queryString = `SELECT * FROM index_value ${data.length > 0 ? "WHERE " : ""
    } `;
  for (let i = 0; i < data.length; i++) {
    let tieuChi = data[i];
    let {
      label,
      leftIndexValue,
      leftIndexList,
      compare,
      compareList,
      rightIndexValue,
      rightIndexList,
      intervalList,
    } = tieuChi;
    let compareString = "";
    if (compareList.length === 5) {
      switch (compare) {
        case 0:
          compareString = ">";
          break;
        case 1:
          compareString = ">=";
          break;
        case 2:
          compareString = "=";
          break;
        case 3:
          compareString = "<";
          break;
        case 4:
          compareString = "<=";
          break;

        default:
          break;
      }
    }
    if (compareList.length === 2) {
      switch (compare) {
        case 0:
          compareString = ["<", ">"];
          break;
        case 1:
          compareString = [">", "<"];
          break;
        default:
          break;
      }
    }

    let right = "";
    let left = "";

    if (rightIndexList[0] === "EMA(5)") {
      switch (rightIndexValue) {
        case 0:
          right = "ema5";
          break;
        case 1:
          right = "ema10";
          break;
        case 2:
          right = "ema15";
          break;
        case 3:
          right = "ema20";
          break;
        case 4:
          right = "ema50";
          break;
        case 5:
          right = "ema100";
          break;
        case 6:
          right = "ema200";
          break;
        default:
          break;
      }
    }
    if (leftIndexList[0] === "EMA(5)") {
      switch (leftIndexValue) {
        case 0:
          left = "ema5";
          break;
        case 1:
          left = "ema10";
          break;
        case 2:
          left = "ema15";
          break;
        case 3:
          left = "ema20";
          break;
        case 4:
          left = "ema50";
          break;
        case 5:
          left = "ema100";
          break;
        case 6:
          left = "ema200";
          break;
        default:
          break;
      }
    }
    if (leftIndexList[0] === "%K(13,5)") {
      switch (leftIndexValue) {
        case 0:
          left = "stochK";
          break;
        case 1:
          left = "stochD";
          break;
        default:
          break;
      }
    }

    if (leftIndexList[0] === "+DI") {
      switch (leftIndexValue) {
        case 0:
          left = "pdi";
          break;
        case 1:
          left = "mdi";
          break;
        case 2:
          left = "adx";
          break;
        default:
          break;
      }
    }

    if (leftIndexList[0] === "Tenkan") {
      switch (leftIndexValue) {
        case 0:
          left = "tenkan";
          break;
        case 1:
          left = "kijun";
          break;
        default:
          break;
      }
    }

    if (rightIndexList[0] === "+DI") {
      switch (rightIndexValue) {
        case 0:
          right = "pdi";
          break;
        case 1:
          right = "mdi";
          break;
        case 2:
          right = "adx";
          break;
        default:
          break;
      }
    }

    if (rightIndexList[0] === "MA(5)") {
      switch (rightIndexValue) {
        case 0:
          right = "sma5";
          break;
        case 1:
          right = "sma10";
          break;
        case 2:
          right = "sma15";
          break;
        case 3:
          right = "sma20";
          break;
        case 4:
          right = "sma50";
          break;
        case 5:
          right = "sma100";
          break;
        case 6:
          right = "sma200";
          break;
        default:
          break;
      }
    }
    if (rightIndexList[0] === "Tenkan") {
      switch (rightIndexValue) {
        case 0:
          right = "tenkan";
          break;
        case 1:
          right = "kijun";
          break;
        default:
          break;
      }
    }
    if (leftIndexList[0] === "MA(5)") {
      switch (leftIndexValue) {
        case 0:
          left = "sma5";
          break;
        case 1:
          left = "sma10";
          break;
        case 2:
          left = "sma15";
          break;
        case 3:
          left = "sma20";
          break;
        case 4:
          left = "sma50";
          break;
        case 5:
          left = "sma100";
          break;
        case 6:
          left = "sma200";
          break;
        default:
          break;
      }
    }

    switch (label) {
      //RSI
      case "Giá trị RSI14":
        queryString += `0 + rsi14 > 0 + ${rightIndexValue[0]
          } && 0 + rsi14 < 0 + ${rightIndexValue[1]} ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "RSI14 so với các vùng giá trị":
        queryString += `0 + rsi14 ${compareString} 0 + ${rightIndexList[rightIndexValue]
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "RSI14 và vùng Quá mua/Quá bán":
        queryString += `0 + rsi14_yesterday ${compareString[0]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } && 0 + rsi14 ${compareString[1]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      //EMA
      case "Giá so với đường TB - EMA":
        queryString += `0 + close ${compareString} 0 + ${right} ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá cắt đường TB - EMA":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + close ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "So sánh 2 đường TB - EMA":
        queryString += `0 + ${left} ${compareString} 0 + ${right}
           ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giao cắt 2 đường TB - EMA":
        queryString += `0 + ${left}_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + ${left} ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;
      //SMA
      case "Giá so với đường TB - MA":
        queryString += `0 + close ${compareString} 0 + ${right} ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "So sánh 2 đường TB - MA":
        queryString += `0 + ${left} ${compareString} 0 + ${right}
           ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giao cắt 2 đường TB - MA":
        queryString += `0 + ${left}_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + ${left} ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá cắt đường TB - MA":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + close ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;

      //ICHIMOKU
      case "Giá so với Tenkan(9)":
        queryString += `0 + close ${compareString} 0 + tenkan ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá so với Kijun(26)":
        queryString += `0 + close ${compareString} 0 + kijun ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá so với Cloud(52)":
        queryString += `0 + close ${compareString} 0 + cloud ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá giao cắt với Tenkan(9)":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + tenkan_yesterday && 0 + close ${compareString[1]} 0 + tenkan ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá giao cắt với Kijun(26)":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + kijun_yesterday && 0 + close ${compareString[1]} 0 + kijun ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá giao cắt với Cloud(52)":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + cloud_yesterday && 0 + close ${compareString[1]} 0 + cloud ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giao cắt thành phần Ichimoku":
        queryString += `0 + ${left}_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + ${left} ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;
      //MACD
      case "MACD so với Signal":
        queryString += `0 + macd ${compareString} 0 + signal_today ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "MACD cắt với Signal":
        queryString += `0 + macd_yesterday ${compareString[0]
          } 0 + signal_yesterday && 0 + macd ${compareString[1]
          } 0 + signal_today ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Trạng thái giá trị của MACD":
        let leftIndex = leftIndexValue === 0 ? "macd" : "signal_today";
        if (rightIndexValue === 0) {
          queryString += `0 + ${leftIndex} >= 0 ${i < data.length - 1 ? "&& " : ""
            }`;
        }
        if (rightIndexValue === 1) {
          queryString += `0 + ${leftIndex} < 0 ${i < data.length - 1 ? "&& " : ""
            }`;
        }
        if (rightIndexValue === 2) {
          queryString += `0 + ${leftIndex} > 0 && 0 + ${leftIndex === "macd" ? "macd_yesterday" : "signal_yesterday"
            } < 0 ${i < data.length - 1 ? "&& " : ""}`;
        }
        if (rightIndexValue === 3) {
          queryString += `0 + ${leftIndex} < 0 && 0 + ${leftIndex === "macd" ? "macd_yesterday" : "signal_yesterday"
            }  > 0 ${i < data.length - 1 ? "&& " : ""}`;
        }
      case "Histogram tăng liên tục":
        for (let j = 1; j < rightIndexValue + 1; j++) {
          queryString += `0 + histogram${j} > 0 + histogram${j + 1} ${j < rightIndexValue ? "&&" : ""
            } `;
        }
        queryString += `${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Histogram giảm liên tục":
        for (let j = 1; j < rightIndexValue + 1; j++) {
          queryString += `0 + histogram${j} < 0 + histogram${j + 1} ${j < rightIndexValue ? "&&" : ""
            } `;
        }
        queryString += `${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá tăng vượt Biên trên":
        queryString += `0 + close > 0 + upperBB1 && 0 + close_yesterday < upperBB2 ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá giảm qua Biên trên":
        queryString += `0 + close < 0 + upperBB1 && 0 + close_yesterday > upperBB2 ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá giảm thủng Biên dưới":
        queryString += `0 + close < 0 + lowerBB1 && 0 + close_yesterday > lowerBB2 ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá tăng qua Biên dưới":
        queryString += `0 + close > 0 + lowerBB1 && 0 + close_yesterday < lowerBB2 ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá duy trì vượt ngoài Biên trên Bollinger":
        for (let j = 1; j < rightIndexValue + 1; j++) {
          queryString += `0 + close${j} > 0 + upperBB${j} ${j < rightIndexValue ? "&&" : ""
            } `;
        }
        queryString += `${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá duy trì ngoài Biên dưới Bollinger":
        for (let j = 1; j < rightIndexValue + 1; j++) {
          queryString += `0 + close${j} < 0 + lowerBB${j} ${j < rightIndexValue ? "&&" : ""
            } `;
        }
        queryString += `${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá trị MFI(20)":
        queryString += `0 + mfi > 0 + ${rightIndexValue[0]} && 0 + mfi < 0 + ${rightIndexValue[1]
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "MFI(20) và vùng Quá mua/Quá bán":
        queryString += `0 + mfi_yesterday ${compareString[0]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } && 0 + mfi ${compareString[1]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Stochastic và vùng Quá mua/Quá bán":
        queryString += `0 + ${left}_yesterday ${compareString[0]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } 
        && 0 + ${left} ${compareString[1]} 0 + ${rightIndexValue === 0 ? 70 : 30
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Stochastic giao cắt nhau":
        queryString += `0 + stochK_yesterday ${compareString[0]
          } 0 + stochD_yesterday && 0 + stochK ${compareString[1]} 0 + stochD ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá trị ADX(14)":
        queryString += `0 + adx > 0 + ${rightIndexValue[0]} && 0 + adx < 0 + ${rightIndexValue[1]
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá trị -DI(14)":
        queryString += `0 + mdi > 0 + ${rightIndexValue[0]} && 0 + mdi < 0 + ${rightIndexValue[1]
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giá trị +DI(14)":
        queryString += `0 + pdi > 0 + ${rightIndexValue[0]} && 0 + pdi < 0 + ${rightIndexValue[1]
          } ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "Giao cắt nhóm ADX":
        queryString += `0 + ${left}_yesterday ${compareString[0]
          } 0 + ${right}_yesterday && 0 + ${left} ${compareString[1]
          } 0 + ${right} ${i < data.length - 1 ? "&& " : ""}`;
        break;
      case "ADX và ngưỡng giá trị":
        queryString += `0 + adx ${compareString} 0 + ${rightIndexValue} ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Giá so với PSar":
        queryString += `0 + close ${compareString} 0 + psar ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "Khoảng cách giá và PSar":
        queryString += `(0 + close) - (0 + psar)  > 0 + ${rightIndexValue[0]
          } && (0 + close) - (0 + psar) < 0 + ${rightIndexValue[1]} ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      case "PSar đảo chiều":
        queryString += `0 + close_yesterday ${compareString[0]
          } 0 + psar_yesterday && 0 + close ${compareString[1]} 0 + psar ${i < data.length - 1 ? "&& " : ""
          }`;
        break;
      default:
        break;
    }
  }

  let listMatched = await query(queryString);
  res.send({ error: false, data: listMatched, message: "Cập nhật thành công" });
});

module.exports = app;
