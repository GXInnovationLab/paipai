// tiny wrapper with default env vars
console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);
module.exports = {
  NODE_ENV: (process.env.NODE_ENV || "development"),
  PORT: (process.env.PORT || 3012)
};
