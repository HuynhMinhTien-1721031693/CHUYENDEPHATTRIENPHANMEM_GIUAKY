import { Link } from "react-router-dom";

/**
 * Thanh điều hướng — nhận dữ liệu từ layout cha (props từ cấp trên, đúng hướng tách component).
 * @param {{ pathname: string, user: { name: string, email: string, role: string } | null | undefined, logout: () => Promise<void> }} props
 */
export default function AppHeader({ pathname, user, logout }) {
  const isHome = pathname === "/";
  const isLiveHub = pathname === "/live";

  return (
    <header className="app-header" role="banner">
      <div className="app-header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">Web Live Stream</span>
        </Link>
        <nav className="header-nav" aria-label="Điều hướng">
          <Link to="/live" className={isLiveHub ? "nav-pill nav-pill--on" : "nav-pill"}>
            Phát trực tiếp
          </Link>
          {user === undefined ? (
            <span className="header-pill">…</span>
          ) : user ? (
            <>
              <span className="header-user" title={user.email}>
                {user.name}
              </span>
              {user.role === "admin" ? (
                <Link to="/admin" className={pathname === "/admin" ? "nav-pill nav-pill--on" : "nav-pill"}>
                  Admin phòng live
                </Link>
              ) : null}
              {user.role === "sysmanager" ? (
                <Link to="/system" className={pathname === "/system" ? "nav-pill nav-pill--on" : "nav-pill"}>
                  Quản lý hệ thống
                </Link>
              ) : null}
              <button type="button" className="btn-text" onClick={() => void logout()}>
                Thoát
              </button>
              {!isHome ? (
                <Link to="/" className="nav-back">
                  ← Task / trang chủ
                </Link>
              ) : null}
            </>
          ) : isHome ? (
            <>
              <span className="header-pill">Chuyên đề — Giữa kỳ</span>
              <Link to="/login" className="nav-pill">
                Đăng nhập
              </Link>
              <Link to="/register" className="nav-pill">
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-pill">
                Đăng nhập
              </Link>
              <Link to="/register" className="nav-pill">
                Đăng ký
              </Link>
              <Link to="/" className="nav-back">
                ← Task / trang chủ
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
