const { default: Axios } = require("axios");

const getNews = async () => {
  const data = await Axios.get(
    "https://newsdata.io/api/1/sources?country=vi&apikey=YOUR_API_KEY"
  );
  console.log("data: ", data);
  return data;
};

getNews();
