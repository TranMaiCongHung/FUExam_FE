import { api } from "./api";

export const profileService = {
    // 6. Thông tin cá nhân
    getProfile() {
        return api.get("/api/me");
    },

    updateProfile(data) {
        return api.patch("/api/me", data);
    }
};
