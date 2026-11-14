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
    },

    // 4.2 Bật/tắt cho phép sinh viên xem ảnh gốc
    toggleViewImage(examId, allowed) {
        const query = typeof allowed === "boolean" ? `?allowed=${allowed}` : "";
        return api.patch(`/api/admin/exams/${examId}/view-image${query}`, {});
    },

    // Tìm đề thi theo id (duyệt qua các trang)
    async findExamById(examId) {
        const size = 100;
        for (let page = 0; page < 50; page++) {
            const res = await this.getExams(page, size);
            const data = res?.data || res;
            const list = data?.content || (Array.isArray(data) ? data : []);
            const found = list.find(e => String(e.id ?? e.examId) === String(examId));
            if (found) return found;
            if (list.length < size) break;
            if (data?.last === true) break;
            if (typeof data?.totalPages === "number" && page + 1 >= data.totalPages) break;
        }
        return null;
    }
};
