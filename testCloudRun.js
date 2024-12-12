const axios = require("axios");
const async = require("async");

// Địa chỉ API
const apiUrl =
  "https://dautubenvung-721299848503.us-central1.run.app/helloHttp";

// Hàm gọi API
const callApi = async (callback) => {
  try {
    const response = await axios.get(apiUrl);
    // console.log("Status:", response.status, "Body:", response.data);
    callback(null, response.data);
  } catch (error) {
    console.error("Error calling API:", error.message);
    callback(error);
  }
};

// Hàm để khởi động một chu kỳ gọi API liên tục mỗi giây
const startApiCalls = () => {
  setInterval(() => {
    async.parallelLimit(
      Array(100).fill((callback) => callApi(callback)), // Mảng 10,000 hàm gọi API
      100, // Giới hạn 100 lời gọi đồng thời
      (err, results) => {
        if (err) {
          console.error("An error occurred:", err);
        } else {
          console.log("API called successfully");
        }
      }
    );
  }, 1000); // Gọi lại mỗi giây
};

// Bắt đầu chu kỳ gọi API
startApiCalls();
