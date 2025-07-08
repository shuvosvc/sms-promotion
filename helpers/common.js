const jwt = require('jsonwebtoken');
const errors = require("./errors");
const responses = require("./responses");
const database = require('../utils/connection');
const { SECRET_KEY,SERVICE_KEY,jwtSecret } = require('../config/ApplicationSettings');
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



exports.verifyJwt = async (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
  
        resolve(null);
      } else {
        resolve(decoded);
      }
    });
  });
};


exports.createSignature = (body, timestamp) => {
  return crypto.createHmac("sha256", SECRET_KEY)  // 🔹 Use HMAC-SHA256
               .update(JSON.stringify(body) + timestamp)  // 🔹 Hash the body + timestamp
               .digest("hex");  // 🔹 Convert to hex string
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


exports.auth = function auth(extraFields, func) {
    if (func == null) {
        func = extraFields;
        extraFields = [];
    }
    return async (req, connection) => {
        exports.checkParams(req, ["accessToken"]);
        const accessToken = req.body.accessToken;
        const decodedToken = await exports.verifyJwt(accessToken, jwtSecret);
        if (decodedToken == null || decodedToken.id == null) throw new errors.INVALID_ACCESS_TOKEN();
       
        const adminQuery = "SELECT * FROM admin WHERE id = $1 ";
        const adminInfo = await connection.queryOne(adminQuery, [decodedToken.id]);


        if (adminInfo == null || adminInfo.id == null) throw new errors.INVALID_ACCESS_TOKEN();
        if (decodedToken.SERVICE_KEY != SERVICE_KEY) throw new errors.INVALID_ACCESS_TOKEN();
      
        return await func(req, connection, adminInfo);
    };
};




/* 🔍 Function to Get Local IP Address */
// exports.getLocalIP = function getLocalIP() {
//   const interfaces = os.networkInterfaces();
//   for (const iface of Object.values(interfaces)) {
//       for (const details of iface) {
//           if (details.family === "IPv4" && !details.internal) {
//               return details.address; // Return first non-internal IPv4 address
//           }
//       }
//   }
//   return "localhost"; // Fallback if no IP is found
// }