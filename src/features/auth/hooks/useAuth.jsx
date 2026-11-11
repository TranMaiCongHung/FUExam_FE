import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService"; // Import từ thư mục services

export function useAuth() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);

        try {
            // 1. Dùng authService gọi API
            const response = await authService.login(username, password);
            const data = response.data; // Backend trả về { message, data: { ... } }

            // 2. Lưu thông tin xác thực
            if (data.token) localStorage.setItem("accessToken", data.token);
            if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
            if (data.username) localStorage.setItem("username", data.username);
            if (data.role) localStorage.setItem("role", data.role);

            // 3. Đăng nhập thành công -> chuyển trang
            if (data.role === 'ADMIN') {
                navigate("/admin/dashboard");
            } else {
                navigate("/"); // Hoặc trang dành riêng cho học viên
            }
        } catch (err) {
            // 4. Báo lỗi
            setError(err.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
}
