const success = (mes = null, payload = []) => {
  return {
    message: mes ? mes : "Thành công",
    error: false,
    payload,
  };
};

const error = (mes = null, payload = []) => {
  return {
    message: mes ? mes : "Thất bại",
    error: true,
    payload,
  };
};

const errorToken = (mes = null) => {
  return {
    message: mes ? mes : "Access Denied",
    token_invalid: true,
    error: true,
    payload: null,
  };
};

module.exports = {
  success,
  error,
  errorToken,
};
