import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./components/AppRoutes.jsx";

/**
 * Điểm vào ứng dụng: chỉ gắn router + provider và render cây route.
 * Logic và UI chi tiết nằm trong components/ và pages/ (theo hướng dẫn cấu trúc src/).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
