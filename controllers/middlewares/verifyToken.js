require("dotenv");
const jwt = require("jsonwebtoken");
const { get } = require("lodash");
const { KEY_HEADER_TOKEN } = require("../../constants");

const registerToken = (payload) => {
  const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: 60 * 60 * 24,
  });
  return token;
};

const registerRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.TOKEN_SECRET_REFRESH, {
    expiresIn: 60 * 60 * 24 * 2,
  });
};

const verifyRefreshToken = (tokenRefresh) => {
  try {
    if (!tokenRefresh) return {};
    const verified = jwt.verify(tokenRefresh, process.env.TOKEN_SECRET_REFRESH);
    const payload = {
      id: get(verified, "id", -1),
      email: get(verified, "email", ""),
      name: get(verified, "name", ""),
      phone: get(verified, "phone", ""),
      address: get(verified, "address", ""),
      admin: get(verified, "permission", 0) === 1,
      image: get(verified, "image", ""),
    };
    const token = registerToken(payload);
    const refreshToken = registerRefreshToken(payload);
    return { token, refreshToken };
  } catch (error) {
    return {};
  }
};

const verifyToken = (request, response, next) => {
  const token = request.header(KEY_HEADER_TOKEN);

  if (!token)
    return response.status(401).send({
      message: "Access Denied",
      token_invalid: true,
      payload: null,
      error: true,
    });
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    next();
  } catch (err) {
    return response.status(403).send({
      message: "Invalid Token",
      token_invalid: true,
      payload: null,
      error: true,
    });
  }
};

module.exports = {
  verifyToken,
  verifyRefreshToken,
  registerToken,
  registerRefreshToken,
};
