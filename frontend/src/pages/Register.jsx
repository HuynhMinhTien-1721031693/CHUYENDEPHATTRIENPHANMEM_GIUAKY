import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSession } from "../api/fetchSession.js";
import FormCursorGlow from "../components/FormCursorGlow.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setBusy(true);
    try {
      const r = await fetchSession("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.message || "Không đăng ký được.");
        return;
      }
      setOk("Đăng ký thành công — hãy đăng nhập.");
      setTimeout(() => navigate("/login", { replace: true }), 900);
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
          <h1 className="page-title">Đăng ký</h1>
          <p className="muted small auth-lead">
            Tạo tài khoản bằng email và mật khẩu.
          </p>
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
          <form className="stack-tight auth-form-inner" onSubmit={onSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="reg-name">
                Tên hiển thị
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="reg-password">
                Mật khẩu (tối thiểu 8 ký tự)
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn primary btn-block" disabled={busy}>
              {busy ? "Đang tạo…" : "Tạo tài khoản"}
            </button>
          </form>
          <p className="muted small auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </FormCursorGlow>
    </div>
  );
}
