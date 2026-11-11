import { api } from "./api";

export const examService = {
    // 4. Quản lý Đề thi
    getExams(page = 0, size = 10, filter = {}) {
        let url = `/api/admin/exams?page=${page}&size=${size}`;
        if (filter?.subjectId) {
            url += `&subjectId=${filter.subjectId}`;
        }
        if (filter?.examType && filter.examType !== 'ALL') {
            url += `&examType=${filter.examType}`;
        }
        return api.get(url);
    },

    createExam(subjectId, data) {
        return api.post(`/api/admin/exams/${subjectId}`, data);
    },

    deleteExam(examId) {
        return api.delete(`/api/admin/exams/${examId}`);
    },

    // 4.1 Bật/tắt ẩn hiện đề thi
    toggleVisibility(examId, visible) {
        const query = typeof visible === "boolean" ? `?visible=${visible}` : "";
        return api.patch(`/api/admin/exams/${examId}/visibility${query}`, {});
    }
};
