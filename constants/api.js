const isProduct = require("./isProduct");

const endpoint = isProduct ? "http://185.250.36.147" : "http://localhost";
const mainEndpoint = `${endpoint}:3020`;

module.exports = { mainEndpoint, endpoint };
