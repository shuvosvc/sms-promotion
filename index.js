const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorhandler = require("errorhandler");
const helmet = require("helmet");
const methodOverride = require("method-override");
const ngrok = require("@ngrok/ngrok");
const { Server } = require("socket.io");

require("dotenv").config();
const { port, BASE_URL, ngrok_domain } = require("./config/ApplicationSettings");
const { registerWebhook, closeWebhook } = require("./helpers/hook");

// Create HTTP server and bind Socket.IO to it
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔌 Export io so controllers can emit events
module.exports.io = io;

// Optional: handle new socket connections
io.on("connection", (socket) => {
  console.log("📡 New Socket Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("💨 Socket Disconnected:", socket.id);
  });
});

// Controllers
const { msg, hookapi } = require("./controllers/sms");
const { signin } = require("./controllers/user");
const {
  deletePromotion,
  updatePromotion,
  getAllPromotions,
  getPromotionById,
  createPromotion
} = require("./controllers/promotion");

/* Routes Config */
app.set("port", port);

/* Middleware Configuration */
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(methodOverride());
app.use(require("./utils/logger"));
app.use(helmet());
app.use(compression());

if (["development", "local"].includes(app.get("env"))) {
  app.use(errorhandler());
}

app.set('trust proxy', 1);

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

/* API Routes */
app.get(`${BASE_URL}/`, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post(`${BASE_URL}/signin`, signin);

app.post(`${BASE_URL}/createPromotion`, createPromotion);
app.post(`${BASE_URL}/getAllPromotions`, getAllPromotions);
app.post(`${BASE_URL}/getPromotionById`, getPromotionById);
app.post(`${BASE_URL}/updatePromotion`, updatePromotion);
app.post(`${BASE_URL}/deletePromotion`, deletePromotion);



app.post(`${BASE_URL}/send-sms`, msg);
app.post(`${BASE_URL}/sms-status`, hookapi);

/* 🚀 Start Server & Register Webhook */
server.listen(port, "0.0.0.0", async () => {
  console.log(`🚀 Server is up and running on port ${port} 🎉`);

  try {
    const listener = await ngrok.connect({ addr: port, authtoken_from_env: true, domain: ngrok_domain });
    const publicUrl = listener.url();
    console.log(`🌍 Public URL: ${publicUrl}`);

    registerWebhook(publicUrl); // Register webhook with ngrok URL
  } catch (error) {
    console.error("❌ Ngrok failed to start:", error);
    process.exit(1);
  }
});

/* 🛑 Graceful Shutdown - Unregister Webhook */
const shutdown = async () => {
  console.log("🛑 Shutting down server...");

  await closeWebhook();

  server.close(() => {
    console.log("✅ Server shut down gracefully.");
    process.exit(0);
  });

  try {
    await ngrok.disconnect();
    console.log("🔌 Ngrok disconnected.");
  } catch (error) {
    console.error("⚠️ Error disconnecting ngrok:", error);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
