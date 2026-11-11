import { api } from "./api";

const HISTORY_KEY_PREFIX = "FUEXAM_ATTEMPT_HISTORY_";

export const practiceService = {
    // 7. Giao diện Luyện thi
    getExamQuestions(examId) {
        return api.get(`/api/exams/${examId}`);
    },

    startAttempt(examId) {
        return api.post(`/api/practice/exams/${examId}/start`);
    },

    checkAnswer(attemptId, questionId, selectedOptionIds) {
        return api.post(`/api/practice/attempts/${attemptId}/questions/${questionId}/check`, {
            selectedOptionIds
        });
    },

    finishAttempt(attemptId) {
        return api.post(`/api/practice/attempts/${attemptId}/finish`);
    },

    // Nộp toàn bộ bài thi và nhận kết quả chi tiết (ExamReviewResponse)
    submitAttempt(attemptId, answers) {
        return api.post(`/api/practice/attempts/${attemptId}/submit`, {
            answers
        });
    },

    // Lấy chi tiết bài thi đã làm để xem lại (ExamReviewResponse)
    getAttemptReview(attemptId) {
        return api.get(`/api/practice/attempts/${attemptId}/review`);
    },

    // === HỖ TRỢ LỊCH SỬ LÀM BÀI ===
    // Lưu lịch sử lần thi vào localStorage theo username để dự phòng khi backend chưa có API list
    saveAttemptHistory(attemptData) {
        try {
            const username = localStorage.getItem("username") || "guest";
            const storageKey = `${HISTORY_KEY_PREFIX}${username}`;
            const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
            
            // Tránh trùng lặp attemptId
            const filtered = existing.filter(a => a.attemptId !== attemptData.attemptId);
            const updated = [attemptData, ...filtered];
            
            localStorage.setItem(storageKey, JSON.stringify(updated));
            return updated;
        } catch (err) {
            console.error("Failed to save attempt to localStorage:", err);
            return [];
        }
    },

    // Lấy danh sách lịch sử thi (giới hạn 3 lần thi gần nhất theo yêu cầu)
    getAttemptHistory(examId = null, limit = 3) {
        try {
            const username = localStorage.getItem("username") || "guest";
            const storageKey = `${HISTORY_KEY_PREFIX}${username}`;
            const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
            
            let result = list;
            if (examId) {
                result = list.filter(a => String(a.examId) === String(examId));
            }
            return limit ? result.slice(0, limit) : result;
        } catch (err) {
            console.error("Failed to load attempt history from localStorage:", err);
            return [];
        }
    }
};
