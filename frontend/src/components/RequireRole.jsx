import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** @param {{ children: React.ReactNode, role: 'admin' | 'sysmanager' }} props */
export function RequireRole({ children, role }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="page-narrow card">
        <p className="muted">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }
  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
