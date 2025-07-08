const crypto = require("crypto");

// Generate a random 32-byte API Key (hex format)
const apiKey = crypto.randomBytes(32).toString("hex");

// Generate a random 64-byte Secret Key (hex format)
const secretKey = crypto.randomBytes(64).toString("hex");

console.log("SMS_API_KEY:", apiKey);
console.log("SMS_SECRET:", secretKey);