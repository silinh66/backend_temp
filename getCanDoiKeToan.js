const fetch = require("node-fetch");
const zlib = require("zlib");
const axios = require("axios");
const { Readable } = require("stream");
const query = require("./common/query");

(async () => {
  let listSymbolData = [];

  let response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  );
  listSymbolData = response?.data?.data || listSymbolData;
  await new Promise((resolve) => setTimeout(resolve, 5000));

  response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  );
  listSymbolData = response.data.data
    ? [...listSymbolData, ...response.data.data]
    : listSymbolData;
  console.log(listSymbolData.length);
  for (let i = 0; i < listSymbolData.length; i++) {
    const symbol = listSymbolData[i]?.Symbol;
    console.log(symbol);
    await getBCTC(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getBCTC = async (symbol) => {
  try {
    const response = await fetch(
      `https://fiin-fundamental.ssi.com.vn/FinancialStatement/GetBalanceSheet?language=vi&OrganCode=${symbol}`,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language":
            "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
          "cache-control": "max-age=0",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie:
            "_ga_KJHZVBRYTH=GS1.1.1693299087.1.1.1693299319.60.0.0; _ga_BR358FQTBG=GS1.1.1701141233.3.1.1701141307.58.0.0; __cuid=2b5f998ea91b4bd892952805b0f4ca02; amp_fef1e8=b53bc194-299f-4a7e-b593-5660d69ed84eR...1hjruogr5.1hjruogr8.31.c.3d; cf_clearance=fNqR34bi4Vi9wWnXlr_72Ovlugz.6P35tAkg_RHy4h4-1706088194-1-Af+ttfQVpqzp+OZB43kjpEICmqrnYTBQA/4zHOR5NOVZOl4d4ZO9DAE/3pmcc4mw6Xn1AnFiiygdIMULUfyOgWU=; _ga_QZJBYSXQCG=GS1.1.1706861408.73.1.1706862698.0.0.0; _gid=GA1.3.1165672540.1710410881; _ga_EXPYE7627Z=GS1.1.1710475143.118.1.1710475181.0.0.0; sso.id_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5zc2kuY29tLnZuIiwic3ViIjoiMjMzNzE4IiwiYXVkIjoiTngwSUpoTXBwaEdpNmRmWSIsImlhdCI6MTcxMDQ3NTE4MiwiZXhwIjoxNzQyMDExMTgyfQ.N_laHpL6gpPyX4HkBIVEKQ8XU8E7YoTDa03fKuaiFfM; _cfuvid=6pNoelnQ324sp4_l73IXrNgTsKgxkkkty_IDeOolJnc-1710489614036-0.0.1.1-604800000; _ga=GA1.1.1434597638.1692668260; _ga_N4QS6QWZH6=GS1.1.1710489621.146.1.1710490267.53.0.0; __cf_bm=xc5JbogmXV6RdJbSnhYAsGzhRht2iSz8MWU15GQYN64-1710490561-1.0.1.1-MuEMucjAJYF72NFPWypnKn8My_YiHy2korBUFvSASHa_UeZ.hCF_JicrlM1sqs1mx1RuJpPCnwGorVHLY0bwXA",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
      }
    );
    // console.log("response: ", response);

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();
          //   console.log("decompressedString: ", decompressedString);

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          //   console.log(jsonObject);
          if (!jsonObject) return;
          let dataResponse = jsonObject?.items;
          let dataQuy = dataResponse?.map((item) => item?.yearly);
          if (!dataQuy) return;
          let dataQuyFilter = dataQuy[0]?.filter(
            (item) => item?.yearReport === 2023 && item?.quarterReport === 5
          );
          console.log("dataQuyFilter: ", dataQuyFilter);
          if (!dataQuyFilter) return;
          let dataQuyMap = dataQuyFilter?.map((item) => {
            return [symbol, ...Object.values(item)];
          });
          //insert new data
          if (dataQuyMap?.length > 0)
            await query("INSERT INTO can_doi_ke_toan VALUES ?", [dataQuyMap]);
          //   let dataNam = dataResponse?.map((item) => item?.yearly);
          //   let dataNamFilter = dataNam[0]?.filter(
          //     (item) => item?.yearReport === 2023 && item?.quarterReport === 5
          //   );
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
};

// getBCTC("BVH");
