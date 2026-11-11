import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Component bảo vệ các Route yêu cầu phải đăng nhập.
 */
export default function ProtectedRoute({ allowedRoles }) {
    const isAuthenticated = !!localStorage.getItem("accessToken");
    const userRole = localStorage.getItem("role");
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Tránh lặp vô hạn nếu đang ở '/' mà lại redirect về '/'
        if (location.pathname === "/") {
            // Dữ liệu cũ bị lỗi (có token nhưng không có role hoặc role sai) -> xóa dọn dẹp
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("role");
            localStorage.removeItem("username");
            return <Navigate to="/login" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
