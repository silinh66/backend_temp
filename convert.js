let { data } = require("./constatnts");
data = data.reverse();
const fs = require("fs");

function groupDataByTime(data, interval) {
  fs.writeFileSync("data.json", JSON.stringify(data));
  // Convert interval to milliseconds
  const intervalMs = convertIntervalToMilliseconds(interval);

  // Create an object to store the grouped data
  const groupedData = {};

  // Iterate over the data array
  for (const item of data) {
    // console.log("item.Time: ", item.Time);
    const time = getTimeGroup(item.Time, item.TradingDate, intervalMs);

    // If the time group doesn't exist, create an empty array for it
    if (!groupedData[time]) {
      groupedData[time] = [];
    }

    // Add the item to the corresponding time group
    groupedData[time].push(item);
  }
  console.log("groupedData: ", groupedData);
  fs.writeFileSync("groupedData.json", JSON.stringify(groupedData));

  //convert groupedData to array
  let groupedDataArray = [];
  for (const key in groupedData) {
    groupedDataArray.push(groupedData[key]);
  }
  let mapData = groupedDataArray.map((item) => {
    // item = item.reverse();
    return {
      Time: item[0].Time,
      Date: item[0].TradingDate,
      Open: +item[0].Open,
      High: Math.max(...item.map((item) => +item.High)),
      Low: Math.min(...item.map((item) => +item.Low)),
      Close: +item[item.length - 1].Close,
      Volume: item.reduce((acc, item) => acc + +item.Volume, 0),
    };
  });
  fs.writeFileSync("mapData.json", JSON.stringify(mapData));
  return mapData;
}

// Helper function to convert interval to milliseconds
function convertIntervalToMilliseconds(interval) {
  const mapping = {
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
  };

  return mapping[interval];
}

// Helper function to get the time group for a given time
function getTimeGroup(time, dateString, intervalMs) {
  const [day, month, year] = dateString.split("/");
  const [hours, minutes, seconds] = time.split(":");

  // Create a new date object using the provided date and time
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );

  // Get the timestamp in milliseconds
  const timestamp = date.getTime();

  // Calculate the nearest interval timestamp
  const nearestTimestamp = Math.floor(timestamp / intervalMs) * intervalMs;

  // Create a new date object using the nearest interval timestamp
  const groupDate = new Date(nearestTimestamp);

  // Extract the time portion
  const groupTime = groupDate.toISOString().substr(11, 8);

  // Format the date
  const formattedDate = `${day}/${month}/${year}`;

  // Combine the grouped time and formatted date
  const groupedTimeWithDate = `${groupTime}/${formattedDate}`;

  return groupedTimeWithDate;
}

// const groupedData = groupDataByTime(data, "5m");
// console.log("groupedData: ", groupedData);

// fs.writeFileSync("groupedDataArray.json", JSON.stringify(groupedDataArray));

module.exports = {
  groupDataByTime,
};
