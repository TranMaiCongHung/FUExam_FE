import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

// Khởi tạo một phiên bản Axios (Axios Instance)
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// INTERCEPTOR 1: Xử lý GỬI ĐI (Tự động gắn Token)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        // Không gửi token nếu đang gọi api login hoặc register
        if (token && !config.url.includes('/api/auth/login')) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Axios tự động thông minh nhận diện FormData nên ta không cần check thủ công như fetch nữa
        return config;
    },
    (error) => Promise.reject(error)
);

// INTERCEPTOR 2: Xử lý NHẬN VỀ (Bắt lỗi và Refresh Token)
apiClient.interceptors.response.use(
    (response) => {
        // Trả về thẳng data để các component không cần phải gõ response.data nữa (giống fetch của bạn)
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Lỗi 401 (Hết hạn Token), không phải là đang ở API Auth, và chưa từng thử lại (retry)
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest.url.toLowerCase().includes('/auth/') &&
            !originalRequest._isRetry
        ) {
            originalRequest._isRetry = true; // Đánh dấu là đã thử lại để tránh vòng lặp vô tận

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('Không có refresh token!');

                // Gọi API làm mới Token (Dùng axios gọi thẳng để tránh bị kẹt vào Interceptor hiện tại)
                const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });

                // Lấy token mới
                const newAccessToken = refreshResponse.data.data?.token || refreshResponse.data?.token;
                const newRefreshToken = refreshResponse.data.data?.refreshToken || refreshResponse.data?.refreshToken;

                // Lưu lại
                localStorage.setItem('accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Gắn token mới vào request bị hỏng ban đầu và chạy lại nó
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error('Làm mới token thất bại:', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('username');
                localStorage.removeItem('role');
                if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        const data = error.response?.data;
        let errorMsg = `Request failed with status ${error.response?.status || 'Unknown'}`;
        
        if (data && typeof data === 'object') {
            if (data.errors) {
                errorMsg = Object.values(data.errors).join('\n');
            } else if (data.message || data.error) {
                errorMsg = data.message || data.error;
            }
        }

        if (!originalRequest?.silent) {
            console.error(`API Error on ${originalRequest?.url}:`, errorMsg);
        }

        // Ném lỗi ra để authService hoặc Hook bắt được
        const customError = new Error(errorMsg);
        customError.response = error.response; // Đính kèm response nguyên bản
        return Promise.reject(customError);
    }
);

// Bọc lại thành đối tượng api (để giữ nguyên cấu trúc gọi api.get, api.post của bạn ở các file khác)
export const api = {
    get: (endpoint, options = {}) => apiClient.get(endpoint, options),
    post: (endpoint, body, options = {}) => apiClient.post(endpoint, body, options),
    put: (endpoint, body, options = {}) => apiClient.put(endpoint, body, options),
    patch: (endpoint, body, options = {}) => apiClient.patch(endpoint, body, options),
    delete: (endpoint, options = {}) => apiClient.delete(endpoint, options),
};
