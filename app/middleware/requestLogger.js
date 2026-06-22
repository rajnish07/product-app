"use strict";

const log = require("../logger");

module.exports = (req, _res, next) => {
  log.info("Incoming request", {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
};
