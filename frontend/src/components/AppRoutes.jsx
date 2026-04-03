import { Navigate, Route, Routes } from "react-router-dom";
import { RequireRole } from "./RequireRole.jsx";
import TasksHome from "../pages/TasksHome.jsx";
import LiveHub from "../pages/LiveHub.jsx";
import HostLive from "../pages/HostLive.jsx";
import WatchLive from "../pages/WatchLive.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import AdminLive from "../pages/AdminLive.jsx";
import SystemManager from "../pages/SystemManager.jsx";
import MainLayout from "./MainLayout.jsx";

/**
 * Khai báo route — tách khỏi App.jsx để App chỉ còn vai trò “gắn provider + router”.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<TasksHome />} />
        <Route path="/live" element={<LiveHub />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminLive />
            </RequireRole>
          }
        />
        <Route
          path="/system"
          element={
            <RequireRole role="sysmanager">
              <SystemManager />
            </RequireRole>
          }
        />
        <Route path="/host" element={<HostLive />} />
        <Route path="/watch/:roomId" element={<WatchLive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
