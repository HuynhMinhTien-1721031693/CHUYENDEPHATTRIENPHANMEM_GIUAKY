import { useCallback, useEffect, useState } from "react";
import { fetchSession } from "../api/fetchSession.js";
import FormCursorGlow from "../components/FormCursorGlow.jsx";

/** Quản lý hệ thống: cấu hình ứng dụng — không quản phòng/host/viewer */
export default function SystemManager() {
  const [siteName, setSiteName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await fetchSession("/api/sys/settings");
      if (!r.ok) {
        setErr("Không đọc được cấu hình.");
        return;
      }
      const d = await r.json();
      const s = d.settings || {};
      setSiteName(s.siteName || "");
      setWelcomeMessage(s.welcomeMessage || "");
      setMaintenanceMode(Boolean(s.maintenanceMode));
    } catch {
      setErr("Lỗi mạng.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setBusy(true);
    try {
      const r = await fetchSession("/api/sys/settings", {
        method: "PATCH",
        body: JSON.stringify({ siteName, welcomeMessage, maintenanceMode }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.message || "Không lưu được.");
        return;
      }
      setOk("Đã lưu cấu hình.");
      if (d.settings) {
        setSiteName(d.settings.siteName || "");
        setWelcomeMessage(d.settings.welcomeMessage || "");
        setMaintenanceMode(Boolean(d.settings.maintenanceMode));
      }
    } catch {
      setErr("Lỗi mạng.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-narrow stack">
      <header className="page-intro">
        <h1 className="page-title">Quản lý hệ thống</h1>
        <p className="page-subtitle">
          Chỉnh <strong>tên site</strong>, <strong>thông báo chào</strong>, <strong>chế độ bảo trì</strong>. Quyền này{" "}
          <strong>không</strong> đóng phòng hay quản viewer — dùng <strong>Admin phòng live</strong> cho việc đó.
        </p>
      </header>
      {err ? (
        <div className="banner error" role="alert">
          {err}
        </div>
      ) : null}
      {ok ? (
        <div className="banner ok" role="status">
          {ok}
        </div>
      ) : null}
      <FormCursorGlow className="auth-cursor-wrap">
        <div className="card auth-card">
          <form className="stack-tight auth-form-inner" onSubmit={onSave}>
            <div className="field">
              <label className="field-label" htmlFor="sys-sitename">
                Tên hiển thị hệ thống
              </label>
              <input
                id="sys-sitename"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="sys-welcome">
                Thông điệp chào (hiển thị công khai qua API)
              </label>
              <textarea
                id="sys-welcome"
                className="field-textarea"
                rows={4}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                maxLength={500}
              />
            </div>
            <label className="field-check">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
              />
              <span>Bật cờ bảo trì (ứng dụng có thể đọc để cảnh báo người dùng)</span>
            </label>
            <button type="submit" className="btn primary btn-block" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu cấu hình"}
            </button>
          </form>
        </div>
      </FormCursorGlow>
    </div>
  );
}
