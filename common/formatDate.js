const formatDate = (dateText) => {
  let date = dateText.split("/");
  return date[2] + "-" + date[1] + "-" + date[0];
};

module.exports = {
  formatDate,
};
