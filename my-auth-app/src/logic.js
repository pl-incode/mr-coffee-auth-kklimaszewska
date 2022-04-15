const crypto = require("crypto");

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash("sha256");

  return sha256.update(password).digest("base64");
};

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString("hex");
};

const timeFormat = (num) => {
    return (num + ":00")
};

function displayDayName(number) {
  if (number === 1) {
    return "monday";
  } else if (number === 2) {
    return "tuesday";
  } else if (number === 3) {
    return "wendsday";
  } else if (number === 4) {
    return "thursday";
  } else if (number === 5) {
    return "friday";
  } else if (number === 6) {
    return "saturday";
  } else {
    return "sunday";
  }
}

module.exports = {
    getHashedPassword: getHashedPassword,
    generateAuthToken: generateAuthToken,
    timeFormat: timeFormat,
    displayDayName: displayDayName,
};
