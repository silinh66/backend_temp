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
   //wait 5s
   await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
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
    // await getBCTC(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
})();

const getBCTC = async (symbol) => {
  try {
    const response = await  fetch("https://fundamental.fiintrade.vn/FinancialStatement/GetBalanceSheet?language=vi&OrganCode=10659", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
        "authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkFEMEJGODU0MDk5ODBCNTcyQTNCN0ZFMUJFOTQwNjcxRkNCMUJEMkQiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJyUXY0VkFtWUMxY3FPM19odnBRR2NmeXh2UzAifQ.eyJuYmYiOjE3MzMzMDM4NTgsImV4cCI6MTczMzMzMjQ1OCwiaXNzIjoiaHR0cHM6Ly9hdXRoLmZpaW50cmFkZS52biIsImF1ZCI6WyJodHRwczovL2F1dGguZmlpbnRyYWRlLnZuL3Jlc291cmNlcyIsIkZpaW5UcmFkZS5NYXJrZXQiLCJGaWluVHJhZGUuQ29yZSIsIkZpaW5UcmFkZS5SZWFsdGltZSIsIkZpaW5UcmFkZS5GdW5kYW1lbnRhbCJdLCJjbGllbnRfaWQiOiJTdG94UGx1cy5GaWluVHJhZGUuU1BBIiwic3ViIjoiMjUwNjA3IiwiYXV0aF90aW1lIjoxNzMzMzAzNzc4LCJpZHAiOiJsb2NhbCIsInVzZXJfaWQiOiIyNTA2MDciLCJ1c2VyX25hbWUiOiJoYW15OTkyMDAxQGdtYWlsLmNvbSIsIm5hbWUiOiIiLCJnaXZlbl9uYW1lIjoiTXkiLCJmYW1pbHlfbmFtZSI6Ik5ndXnhu4VuIiwibWlkZGxlX25hbWUiOiIiLCJlbWFpbCI6ImhhbXk5OTIwMDFAZ21haWwuY29tIiwic2VydmljZV90eXBlIjoiRmlpbkdyb3VwLkZpaW5UcmFkZSIsImxpc3RfcGFja2FnZSI6IkZpaW5UcmFkZS5UcmlhbCIsImxpc3RfZmVhdHVyZSI6IiIsImxpc3RfYXBpIjoiIiwicm9sZSI6IkNVU1RPTUVSIiwiZ3JvdXBfbmFtZSI6IkluZGl2aWR1YWwiLCJzdGFydF9kYXRlIjoiMDQvMTIvMjAyNCIsImVuZF9kYXRlIjoiMTgvMTIvMjAyNCIsImhpdGNvdW50X3Blcm1vbnRoIjoiMCIsImNvbWdyb3VwX2xpbWl0IjoiIiwidGlja2VyX2xpbWl0IjoiIiwidGltZXJhbmdlX2xpbWl0IjoiMCIsImRhdGFyYW5nZV9saW1pdCI6IjAiLCJwZXJfbWludXRlIjoiMCIsInBlcl9ob3VyIjoiMCIsInBlcl9kYXkiOiIwIiwicGVyX21vbnRoIjoiMCIsImVuYWJsZWQiOiJUcnVlIiwibGFzdF9hdHRlbXB0IjoiIiwibGFzdF9hdHRlbXB0X3N0YXR1cyI6IiIsImZpbmdlcnByaW50IjoiYzc0OTBlMDkyN2M0MWZmZGYzYzk0MTIxNWIzOWJiNGQiLCJjbGllbnR0eXBlIjoiV0VCQ0xJRU5UIiwic2NvcGUiOlsib3BlbmlkIiwiRmlpblRyYWRlLk1hcmtldCIsIkZpaW5UcmFkZS5Db3JlIiwiRmlpblRyYWRlLlJlYWx0aW1lIiwiRmlpblRyYWRlLkZ1bmRhbWVudGFsIl0sImFtciI6WyJwd2QiXX0.LJmn1KeZjtF7lNwTnWmSRPITX2DhsnVJ3fevVzfPBFCAghuosoYdi4on3qMIbtApne9Dfl10YGccI-o1NHJrKX2c74cPxyGTnD0erqdU9re59spQAs-aPZ_Mj-b08HTxzltYyLvbK71YI-lJfQoECko0QbXJQDTxlOOY5pv3c4a4UNzBaKrGTO5DBhd4XbNkoYk9YWQDA6PaMeNaPyf-MHdxgNB4WvERlCd__wtMs_xBy9GbUb3fq9fegDOwi1DhGgRnPVVVaRWxsoaN4h10AO4BB2xLU5KnJi9OsCYV1IpZG2gA2DAhAoGRwOSHqZxYFk9KiobqVrhCIuLY5odrkg",
        "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "u250607": "katYjo0Quh76Gj2rZPc8TQ==",
        "Referer": "https://fiintrade.vn/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    });
    // fetch(
    //   `https://fiin-fundamental.ssi.com.vn/FinancialStatement/GetCashFlow?language=vi&OrganCode=${symbol}`,
    //   {
    //     headers: {
    //       accept: "application/json",
    //       "accept-language":
    //         "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ru-RU;q=0.6,ru;q=0.5",
    //       "content-type": "application/json",
    //       "sec-ch-ua":
    //         '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    //       "sec-ch-ua-mobile": "?0",
    //       "sec-ch-ua-platform": '"Windows"',
    //       "sec-fetch-dest": "empty",
    //       "sec-fetch-mode": "cors",
    //       "sec-fetch-site": "same-site",
    //       "x-fiin-key": "KEY",
    //       "x-fiin-seed": "SEED",
    //       "x-fiin-user-id": "ID",
    //       Referer: "https://iboard.ssi.com.vn/",
    //       "Referrer-Policy": "strict-origin-when-cross-origin",
    //     },
    //     body: null,
    //     method: "GET",
    //   }
    // );
   
    console.log("response: ", response);

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
            console.log("decompressedString: ", decompressedString);

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
            console.log(jsonObject);
          if (!jsonObject) return;
          let dataResponse = jsonObject?.items;
          console.log("dataResponse: ", dataResponse);
          let dataQuy = dataResponse?.map((item) => item?.yearly);
          if (!dataQuy) return;
          let dataQuyFilter = dataQuy[0]?.filter(
            (item) => item?.yearReport === 2024 
            // && item?.quarterReport !== 5
          );
          console.log("dataQuyFilter: ", dataQuyFilter);
          if (!dataQuyFilter) return;
          let dataQuyMap = dataQuyFilter?.map((item) => {
            return [...Object.values(item)];
          });
          console.log('dataQuyMap', dataQuyMap)
          //   insert new data
          // if (dataQuyMap?.length > 0)
          //   await query("INSERT INTO luu_chuyen_tien_te VALUES ?", [
          //     dataQuyMap,
          //   ]);
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

getBCTC("AAA");