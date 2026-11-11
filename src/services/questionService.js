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
