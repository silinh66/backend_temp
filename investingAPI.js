const { investing } = require("investing-com-api");

async function main() {
  try {
    const response1 = await investing("commodities/gold"); // Providing a valid mapping.js key
    console.log("response1: ", response1);
    // const response2 = await investing("currencies/eur-usd", "P1M", "P1D"); // With optional params
    // console.log("response2: ", response2);
    // const response3 = await investing("1"); // Providing the pairId directly, even if not present in mapping.js
    // console.log("response3: ", response3);
  } catch (err) {
    console.error(err);
  }
}

main();
