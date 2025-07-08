// Import modules:
//import * as errors from './errors.js';
//import * as database from '../utils/database.js';
const errors = require("./errors");
const responses = require("./responses");
const database = require('../utils/connection');
const { SECRET_KEY,API_KEYS } = require('../config/ApplicationSettings');
const os = require("os");
const crypto = require("crypto");



exports.checkParams = function checkParams(req, requiredParams) {
    // Go through each required parameter, check if blank:
    for (const arg of requiredParams) {
        let val = req.body[arg];
        // NOTE: triple equals checks if arr[i] is a string in addition to it being empty
        if (val == null || val === '') {
            // Required parameter is blank, return error:
            throw new errors.PARAMETER_MISSING({ missing: arg });
        }
    }
}
exports.generateOtp = () => {
    return {
      otp: Math.floor(Math.random() * 90000) + 10000,
    };
  };






exports.api = function api(requiredParams, func) {
  if (func == null) {
      func = requiredParams;
      requiredParams = [];
  }
  return async (req, res) => {
      let connection;
      try {
          exports.checkParams(req, requiredParams);
          connection = await database.getConnection();
          await connection.beginTransaction();
          const result = await func(req, connection);
          await connection.commit();
          await connection.release();
          if (result instanceof responses.QResponse) return result.apply(res);
          return result != null && res.send(result);
      } catch (err) {
          if (connection != null) {
              await connection.rollback();
              await connection.release();
          }
          if (err instanceof errors.QError) return res.send(err);
          req.logger.error(err);
          return res.send(new errors.ERROR_IN_EXECUTION());
      }
  }
};
exports.createSignature = (body, timestamp) => {
  return crypto.createHmac("sha256", SECRET_KEY)  // 🔹 Use HMAC-SHA256
               .update(JSON.stringify(body) + timestamp)  // 🔹 Hash the body + timestamp
               .digest("hex");  // 🔹 Convert to hex string
};


exports.auth = function auth(extraFields, func) {
  if (func == null) {
      func = extraFields;
      extraFields = [];
  }

  return async (req, connection) => {
      const headers = Object.keys(req.headers).reduce((acc, key) => {
          acc[key.toLowerCase()] = req.headers[key]; // Normalize case
          return acc;
      }, {});

      const apiKey = headers["x-api-key"];
      const signature = headers["x-signature"];
      const timestamp = headers["x-timestamp"];

      if (!apiKey) throw new errors.PARAMETER_MISSING({ missing: "x-api-key" });
      if (!signature) throw new errors.PARAMETER_MISSING({ missing: "x-signature" });
      if (!timestamp) throw new errors.PARAMETER_MISSING({ missing: "x-timestamp" });

      if (!API_KEYS.includes(apiKey)) throw new errors.UNAUTHORIZED({f:"s"});

      // 🔹 Prevent replay attacks (optional)
      const requestAge = Math.abs(Date.now() - parseInt(timestamp, 10));
      if (requestAge > 5 * 60 * 1000) throw new errors.UNAUTHORIZED({f:"m"}); // More than 5 min old

      const expectedSignature = exports.createSignature(req.body, timestamp);

      // 🔹 Secure signature comparison
      const sigBuffer = Buffer.from(signature, "hex");
      const expSigBuffer = Buffer.from(expectedSignature, "hex");

      if (sigBuffer.length !== expSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expSigBuffer)) {
          throw new errors.UNAUTHORIZED({f:"t"});
      }

      const parsedTime = new Date(parseInt(timestamp, 10))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");


      return await func(req, connection, {apiKey,parsedTime});
  };
};



/* 🔍 Function to Get Local IP Address */
exports.getLocalIP = function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
      for (const details of iface) {
          if (details.family === "IPv4" && !details.internal) {
              return details.address; // Return first non-internal IPv4 address
          }
      }
  }
  return "localhost"; // Fallback if no IP is found
}