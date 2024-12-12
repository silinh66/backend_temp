// npm install zenrows
const { ZenRows } = require("zenrows");

(async () => {
  const client = new ZenRows("c774641bbd0fb41b3489ef7ebc18bc1859eca0c4");
  const url =
    "https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=1&from=1697431278&to=1697517738";

  try {
    const { data } = await client.get(url, {});
    let dataMap = {
      c: data.c.map((item) => item.toFixed(2)),
      h: data.h.map((item) => item.toFixed(2)),
      l: data.l.map((item) => item.toFixed(2)),
      o: data.o.map((item) => item.toFixed(2)),
      s: "ok",
      t: data.t,
      v: data.v.map((item) => item.toFixed(2)),
    };
    console.log(dataMap);
  } catch (error) {
    console.error(error.message);
    if (error.response) {
      console.error(error.response.data);
    }
  }
})();
