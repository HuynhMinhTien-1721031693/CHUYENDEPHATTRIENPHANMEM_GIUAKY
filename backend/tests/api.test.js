const request = require("supertest");
const { app } = require("../src/index");

describe("HTTP API", () => {
  it("GET /api/health có version", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("web-live-signal");
    expect(res.body.version).toBeTruthy();
  });

  it("GET /api/room mã không hợp lệ → validFormat false", async () => {
    const res = await request(app).get("/api/room/!!!/exists");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false, validFormat: false });
  });

  it("GET /api/public/site-info", async () => {
    const res = await request(app).get("/api/public/site-info");
    expect(res.status).toBe(200);
    expect(res.body.siteName).toBeTruthy();
    expect(typeof res.body.maintenanceMode).toBe("boolean");
  });

  it("GET /api/auth/me khi chưa đăng nhập", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it("GET /api/room mã hợp lệ nhưng không có phòng", async () => {
    const res = await request(app).get("/api/room/abcd1234/exists");
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.validFormat).toBe(true);
    expect(res.body.viewers).toBe(0);
    expect(res.body.comments).toBe(0);
    expect(res.body.likes).toBe(0);
  });
});
