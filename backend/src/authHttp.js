const session = require("express-session");
const passport = require("passport");

const users = require("./usersStore");

/**
 * @param {import('express').Express} app
 * @param {{ live: ReturnType<import('./liveRooms').createLiveRooms> }} ctx
 */
function setupAuthAndRoutes(app, ctx) {
  const { live } = ctx;

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-session-secret-doi-khi-trien-khai",
      resave: false,
      saveUninitialized: false,
      name: "wls.sid",
      cookie: {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "1",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    try {
      const u = users.findById(id);
      done(null, u || null);
    } catch (e) {
      done(e);
    }
  });

  function requireAuth(req, res, next) {
    if (req.user) return next();
    return res.status(401).json({ ok: false, message: "Cần đăng nhập." });
  }

  function requireAdmin(req, res, next) {
    if (req.user && req.user.role === "admin") return next();
    return res.status(403).json({ ok: false, message: "Chỉ Admin phòng live mới vào được." });
  }

  function requireSysmanager(req, res, next) {
    if (req.user && req.user.role === "sysmanager") return next();
    return res.status(403).json({ ok: false, message: "Chỉ Quản lý hệ thống mới vào được." });
  }

  app.get("/api/public/site-info", (_req, res) => {
    const s = users.getSystemSettings();
    res.json({
      siteName: s.siteName,
      welcomeMessage: s.welcomeMessage,
      maintenanceMode: s.maintenanceMode,
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const r = users.createLocalUser(email, password, name);
    if (!r.ok) {
      return res.status(400).json({ ok: false, message: r.error });
    }
    res.status(201).json({ ok: true, user: r.user });
  });

  app.post("/api/auth/login", (req, res, next) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = users.verifyLocalLogin(email, password);
    if (!user) {
      return res.status(401).json({ ok: false, message: "Sai email hoặc mật khẩu." });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ ok: true, user: users.publicUser(user) });
    });
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.json({ user: null });
    res.json({ user: users.publicUser(req.user) });
  });

  /** --- Admin: quản lý phòng live / host & viewer (khác Quản lý hệ thống) --- */
  app.get("/api/admin/rooms", requireAuth, requireAdmin, (_req, res) => {
    res.json({ rooms: live.listRoomsSnapshot() });
  });

  app.post("/api/admin/rooms/:roomId/close", requireAuth, requireAdmin, (req, res) => {
    const ok = live.forceCloseRoom(req.params.roomId);
    if (!ok) return res.status(404).json({ ok: false, message: "Không thấy phòng." });
    res.json({ ok: true });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, (_req, res) => {
    res.json({ users: users.listUsersPublic() });
  });

  /** --- Quản lý hệ thống: cấu hình ứng dụng (không quản host/viewer) --- */
  app.get("/api/sys/settings", requireAuth, requireSysmanager, (_req, res) => {
    res.json({ settings: users.getSystemSettings() });
  });

  app.patch("/api/sys/settings", requireAuth, requireSysmanager, (req, res) => {
    const next = users.updateSystemSettings({
      siteName: req.body?.siteName,
      maintenanceMode: req.body?.maintenanceMode,
      welcomeMessage: req.body?.welcomeMessage,
    });
    res.json({ ok: true, settings: next });
  });
}

module.exports = { setupAuthAndRoutes };
