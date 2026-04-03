import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppHeader from "./AppHeader.jsx";
import AppFooter from "./AppFooter.jsx";

/**
 * Khung trang: gom dữ liệu từ context/location rồi truyền xuống header (lifting state / props pattern).
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua đến nội dung chính
      </a>
      <AppHeader pathname={pathname} user={user} logout={logout} />
      <main id="main-content" className="page" tabIndex={-1}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
