const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { createLiveRooms, normalizeRoomId } = require("./liveRooms");
const users = require("./usersStore");
const { setupAuthAndRoutes } = require("./authHttp");

const PORT = process.env.PORT || 3001;
const { version } = require(path.join(__dirname, "..", "package.json"));

const seedOpts = {
  sysmanagerEmail: process.env.SEED_SYSMANAGER_EMAIL,
  sysmanagerPassword: process.env.SEED_SYSMANAGER_PASSWORD,
  adminEmail: process.env.SEED_ADMIN_EMAIL,
  adminPassword: process.env.SEED_ADMIN_PASSWORD,
};
users.ensureSeed(seedOpts);

if (
  process.env.NODE_ENV !== "test" &&
  require.main === module &&
  (!seedOpts.sysmanagerEmail || !seedOpts.adminEmail)
) {
  console.warn(
    "[auth] Thiếu SEED_SYSMANAGER_* hoặc SEED_ADMIN_* trong backend/.env — tạo file .env từ .env.example rồi khởi động lại backend."
  );
}

const live = createLiveRooms({ maxViewersPerRoom: 20 });

const app = express();

const allowCors =
  process.env.NODE_ENV === "test"
    ? { origin: true, credentials: true }
    : {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
      };
app.use(cors(allowCors));
app.use(express.json({ limit: "100kb" }));

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

setupAuthAndRoutes(app, { live });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "web-live-signal", version });
});

app.get("/api/room/:roomId/exists", (req, res) => {
  const id = normalizeRoomId(req.params.roomId);
  if (!id) {
    return res.json({ exists: false, validFormat: false });
  }
  res.json({
    exists: live.hasRoom(id),
    validFormat: true,
    viewers: live.viewerCount(id),
    comments: live.commentCount(id),
    likes: live.likeCount(id),
  });
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: "/live-signal" });

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      live.handleMessage(ws, msg);
    } catch {
      /* ignore malformed */
    }
  });
  ws.on("close", () => live.handleClose(ws));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`HTTP + WebSocket: http://localhost:${PORT}  (signal: /live-signal)`);
  });
}

module.exports = { app, server, live };
