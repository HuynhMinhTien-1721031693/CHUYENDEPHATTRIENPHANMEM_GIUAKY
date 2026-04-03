const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const DATA_PATH = path.join(__dirname, "..", "data", "app-data.json");

/** @typedef {'user' | 'admin' | 'sysmanager'} UserRole */

/**
 * @typedef {{
 *   id: string,
 *   email: string,
 *   name: string,
 *   passwordHash: string | null,
 *   role: UserRole,
 *   provider: 'local' | string,
 *   providerId: string | null,
 *   createdAt: string
 * }} User
 */

function defaultDb() {
  return {
    users: [],
    /** Cấu hình do Quản lý hệ thống chỉnh — không dùng cho Admin phòng live */
    systemSettings: {
      siteName: "Web Live Stream",
      maintenanceMode: false,
      welcomeMessage: "Chào mừng đến với nền tảng phát trực tiếp.",
    },
  };
}

function readDb() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const db = JSON.parse(raw);
    if (!Array.isArray(db.users)) db.users = [];
    if (!db.systemSettings || typeof db.systemSettings !== "object") {
      db.systemSettings = defaultDb().systemSettings;
    }
    return db;
  } catch {
    return defaultDb();
  }
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), "utf8");
}

/**
 * Tạo hoặc **đồng bộ lại** tài khoản seed: nếu email đã tồn tại (vd. đã đăng ký web trước đó)
 * nhưng sai `role` / mật khẩu / `provider`, cập nhật cho khớp `.env` — để đăng nhập quản trị được.
 *
 * @param {{ sysmanagerEmail?: string, sysmanagerPassword?: string, adminEmail?: string, adminPassword?: string }} opts
 */
function ensureSeed(opts) {
  const db = readDb();
  let changed = false;

  const upsertSeedUser = (email, password, role) => {
    if (!email || !password) return;
    const norm = email.trim().toLowerCase();
    const idx = db.users.findIndex((u) => u.email === norm);
    const displayName = role === "sysmanager" ? "Quản lý hệ thống" : "Admin phòng live";

    if (idx === -1) {
      db.users.push({
        id: randomUUID(),
        email: norm,
        name: displayName,
        passwordHash: bcrypt.hashSync(password, 10),
        role,
        provider: "local",
        providerId: null,
        createdAt: new Date().toISOString(),
      });
      changed = true;
      return;
    }

    const u = db.users[idx];
    const passwordOk = Boolean(u.passwordHash && bcrypt.compareSync(password, u.passwordHash));
    if (u.role === role && passwordOk && u.provider === "local") return;

    db.users[idx] = {
      ...u,
      role,
      name: displayName,
      passwordHash: bcrypt.hashSync(password, 10),
      provider: "local",
      providerId: null,
    };
    changed = true;
  };

  upsertSeedUser(opts.sysmanagerEmail, opts.sysmanagerPassword, "sysmanager");
  upsertSeedUser(opts.adminEmail, opts.adminPassword, "admin");

  if (changed) writeDb(db);
}

/**
 * @param {string} email
 * @param {string} password
 * @param {string} name
 */
function createLocalUser(email, password, name) {
  const db = readDb();
  const norm = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === norm)) {
    return { ok: false, error: "Email đã được đăng ký." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Mật khẩu tối thiểu 8 ký tự." };
  }
  const user = {
    id: randomUUID(),
    email: norm,
    name: String(name || "").trim() || norm.split("@")[0],
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    provider: "local",
    providerId: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  return { ok: true, user: publicUser(user) };
}

/**
 * @param {string} email
 * @param {string} password
 */
function verifyLocalLogin(email, password) {
  const db = readDb();
  const norm = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email === norm && u.provider === "local");
  if (!user || !user.passwordHash) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return user;
}

/** @param {string} id */
function findById(id) {
  const db = readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

/** @param {User} u */
function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, provider: u.provider };
}

function listUsersPublic() {
  return readDb().users.map(publicUser);
}

function getSystemSettings() {
  return { ...readDb().systemSettings };
}

/**
 * @param {Partial<{ siteName: string, maintenanceMode: boolean, welcomeMessage: string }>} patch
 */
function updateSystemSettings(patch) {
  const db = readDb();
  const s = db.systemSettings;
  if (typeof patch.siteName === "string" && patch.siteName.trim()) {
    s.siteName = patch.siteName.trim().slice(0, 120);
  }
  if (typeof patch.maintenanceMode === "boolean") {
    s.maintenanceMode = patch.maintenanceMode;
  }
  if (typeof patch.welcomeMessage === "string") {
    s.welcomeMessage = patch.welcomeMessage.trim().slice(0, 500);
  }
  writeDb(db);
  return { ...s };
}

module.exports = {
  ensureSeed,
  createLocalUser,
  verifyLocalLogin,
  findById,
  publicUser,
  listUsersPublic,
  getSystemSettings,
  updateSystemSettings,
  DATA_PATH,
};
