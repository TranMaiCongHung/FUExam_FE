import { api } from "./api";

export const authService = {
    async login(username, password) {
        return await api.post("/api/auth/login", { username, password });
    },

    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post("/api/auth/logout", { refreshToken });
            }
        } catch (error) {
            console.error("Failed to perform logout on backend:", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
        }
    }
};
