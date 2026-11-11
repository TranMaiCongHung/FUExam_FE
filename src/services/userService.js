import { api } from "./api";

export const userService = {
    // 1.1 Xem danh sách Users
    getUsers(page = 0, size = 10) {
        return api.get(`/api/admin/users?page=${page}&size=${size}`);
    },

    // 1.2 Lấy chi tiết một User
    getUserById(id) {
        return api.get(`/api/admin/users/${id}`);
    },

    // 1.3 Tạo User mới
    createUser(data) {
        return api.post("/api/admin/users/add", data);
    },

    // 1.4 Cập nhật User (Role và Status)
    updateUser(id, data) {
        return api.patch(`/api/admin/users/${id}`, data);
    }
};
