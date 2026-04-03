import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSession } from "../api/fetchSession.js";
import FormCursorGlow from "../components/FormCursorGlow.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { refresh, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetchSession("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.message || "Đăng nhập thất bại.");
        return;
      }
      await refresh();
      navigate("/", { replace: true });
    } catch {
      setErr("Không kết nối được server.");
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="page-narrow">
        <p className="muted">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <FormCursorGlow className="auth-cursor-wrap">
        <div className="card auth-card">
          <h1 className="page-title">Đăng nhập</h1>
          <p className="muted small auth-lead">
            Tài khoản thường dùng để theo dõi nội dung. Vai trò <strong>Admin phòng live</strong> và{" "}
            <strong>Quản lý hệ thống</strong> là hai quyền khác nhau — xem menu sau khi đăng nhập.
          </p>
          {err ? (
            <div className="banner error" role="alert">
              {err}
            </div>
          ) : null}
          <form className="stack-tight auth-form-inner" onSubmit={onSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="login-password">
                Mật khẩu
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn primary btn-block" disabled={busy}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
          <p className="muted small auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </FormCursorGlow>
    </div>
  );
}
