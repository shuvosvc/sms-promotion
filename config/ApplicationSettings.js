require("dotenv").config();



var ApplicationSettings = {
  port: process.env.PORT || "7000",
  BASE_URL: process.env.BASE_URL || "/v1",
  jwtSecret: process.env.JWTSECRET || "fish",
  MaxExpirationSeconds: process.env.MAX_EXPIRATION_SECONDS || 3600,

  // Individual PostgreSQL settings
  postgresHost: process.env.POSTGRES_HOST || "localhost",
  postgresUser: process.env.POSTGRES_USER || "default",
  postgresPassword: process.env.POSTGRES_PASSWORD || "",
  postgresDatabase: process.env.POSTGRES_DATABASE || "mydatabase",
  connectionLimit: process.env.CONNECTION_LIMIT || 100,

  // sms gate way setting settings
  SGUM: process.env.SMS_GATEWAY_URL_MSG || "https://api.sms-gate.app/3rdparty/v1/message",
  SGUH: process.env.SMS_GATEWAY_URL_HOOK || "https://api.sms-gate.app/3rdparty/v1/webhooks",
  SGU_user: process.env.SMS_GATEWAY_URL_USERNAME || "6GI2AE",
  SGU_pass: process.env.SMS_GATEWAY_URL_PASSWORD || "7061svcmycloudpass",
  SECRET_KEY: process.env.SMS_SECRET || "smsecret",
  API_KEYS:process.env.SMS_SERVICE_KEYS?.split(",") || [],
  HOOK_ID:process.env.HOOK_ID || "7061svclmsgid233",
  DEVICE_ID:process.env.DEVICE_ID ||"MLQTSyKUUHW8OvutqAMq1",
  ngrok_domain: process.env.NGROK_DOMAIN || "eminent-internal-thrush.ngrok-free.app",

};

module.exports = ApplicationSettings;
