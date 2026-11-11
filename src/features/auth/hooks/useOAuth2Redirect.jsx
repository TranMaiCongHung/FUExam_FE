import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook xử lý kết quả trả về từ Backend sau khi người dùng đăng nhập Google.
 * Backend sẽ chuyển hướng (redirect) về lại trang Frontend kèm theo token trên URL.
 */
export function useOAuth2Redirect() {
    const navigate = useNavigate(); // Dùng để điều hướng trang
    const location = useLocation(); // Dùng để đọc thông tin URL hiện tại (ví dụ: thanh địa chỉ)

    useEffect(() => {
        // 1. Phân tích chuỗi query trên URL (phần sau dấu chấm hỏi '?')
        const params = new URLSearchParams(location.search);
        
        // 2. Trích xuất token và lỗi từ URL (ví dụ: ?token=abc&error=xyz)
        const token = params.get('token');
        const error = params.get('error');

        // 3. Xử lý kết quả
        if (token) {
            // Đăng nhập thành công: Lưu Token vào hệ thống (localStorage)
            localStorage.setItem('accessToken', token);
            
            let role = params.get('role');
            let username = params.get('username') || params.get('email');

            // Giải mã JWT để trích xuất role & username nếu URL chưa có
            if (!role && token.includes('.')) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    role = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles) || payload.scope || (payload.authorities?.[0]?.authority);
                    if (!username) username = payload.sub || payload.username || payload.email;
                } catch (e) {
                    console.warn("Could not parse JWT payload:", e);
                }
            }

            if (!role) role = "USER";
            localStorage.setItem('role', role);
            if (username) localStorage.setItem('username', username);

            // Phân quyền điều hướng: Admin vào Dashboard quản trị, User vào trang luyện thi
            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } else {
            // Đăng nhập lỗi (ví dụ: email đã được đăng ký bằng phương thức khác)
            console.error("Đăng nhập bằng Google thất bại:", error);
            
            // Xóa thông tin cũ và trả về trang đăng nhập để thử lại
            navigate('/login');
        }
    }, [location, navigate]); // Hook này sẽ chạy mỗi khi URL (location) thay đổi
}
