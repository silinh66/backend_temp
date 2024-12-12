const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/images/");
  },
  filename: (req, file, callback) => {
    let dotFile = "";
    if (file.mimetype === "image/jpeg") dotFile = ".jpg";
    if (file.mimetype === "image/png") dotFile = ".png";

    const date = new Date();
    callback(null, date.getTime() + "-" + uuidv4() + dotFile);
  },
});

const fileFilter = (req, file, callback) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    callback(null, true);
  } else {
    callback(new Error("File not image (.jpeg or .png) !"), false);
  }
};

const uploadImg = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
}).single("file");

module.exports = uploadImg;
