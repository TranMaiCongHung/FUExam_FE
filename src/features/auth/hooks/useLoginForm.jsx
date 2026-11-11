import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Custom hook xử lý toàn bộ logic cho trang Đăng nhập.
 * Giúp tách biệt phần xử lý dữ liệu (Logic) ra khỏi phần giao diện (UI).
 */
export function useLoginForm() {
    // 1. Gọi hook useAuth có sẵn của hệ thống để lấy hàm login, trạng thái loading và thông báo lỗi
    const { login, loading, error } = useAuth();
    
    // 2. Khởi tạo state lưu trữ dữ liệu người dùng nhập vào form (email/username và password)
    const [form, setForm] = useState({ identifier: "", password: "" });

    /**
     * Hàm xử lý khi người dùng gõ vào các ô input.
     * Cập nhật linh hoạt state `form` dựa trên tên của trường (field)
     * @param {string} field - Tên của input (ví dụ: 'identifier', 'password')
     */
    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    /**
     * Hàm xử lý khi người dùng nhấn nút "Đăng nhập"
     * Chặn hành vi load lại trang mặc định của form và gọi API login
     */
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn trình duyệt tải lại trang
        login(form.identifier, form.password); // Gọi hàm xác thực từ hệ thống
    };

    /**
     * Hàm xử lý khi nhấn "Đăng nhập bằng Google"
     * Chuyển hướng trực tiếp sang Backend để Backend thực hiện luồng OAuth2 với Google
     */
    const handleGoogleLogin = () => {
        // Chú ý: Đổi cổng 8080 thành cổng thực tế mà Backend Spring Boot đang chạy
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    };

    // Trả về các dữ liệu và hàm cần thiết để Component giao diện (UI) sử dụng
    return {
        form,               // Dữ liệu trong các ô input
        loading,            // Cờ đánh dấu đang gọi API (để disable nút bấm)
        error,              // Thông báo lỗi nếu có
        handleChange,       // Hàm gán vào sự kiện onChange của input
        handleSubmit,       // Hàm gán vào sự kiện onSubmit của form
        handleGoogleLogin,  // Hàm gán vào nút Đăng nhập Google
    };
}
