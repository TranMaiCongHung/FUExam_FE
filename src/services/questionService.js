import { api } from "./api";

export const questionService = {
    // 5. Quản lý Câu hỏi & OCR
    extractOcr(examId, files) {
        const formData = new FormData();
        // Giả sử files là mảng các file
        files.forEach(file => {
            formData.append("file", file);
        });

        // Sử dụng axios client nguyên bản của api hoặc cấu hình headers multipart cho interceptor của api
        return api.post(`/api/admin/exams/${examId}/extract-ocr`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    },

    createQuestion(examId, payload, imageFile) {
        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
        if (imageFile) fd.append("image", imageFile);
        // Bắt buộc ghi đè Content-Type: instance mặc định là application/json nên axios 1.x
        // sẽ serialize FormData thành JSON. Với multipart/form-data, adapter trình duyệt
        // bỏ header này để trình duyệt tự thêm boundary.
        return api.post(`/api/admin/exams/${examId}/questions`, fd, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    saveBulkQuestions(examId, questions) {
        // Lưu ý backend: Tuyệt đối không gửi field `image` MultipartFile
        return api.post(`/api/admin/exams/${examId}/questions/bulk`, questions);
    },

    updateQuestion(examId, questionId, data) {
        return api.put(`/api/admin/exams/${examId}/questions/${questionId}`, data);
    },

    updateQuestionImage(examId, questionId, file) {
        const formData = new FormData();
        formData.append("file", file);

        return api.patch(`/api/admin/exams/${examId}/questions/${questionId}/image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    },

    deleteQuestion(examId, questionId) {
        return api.delete(`/api/admin/exams/${examId}/questions/${questionId}`);
    }
};
