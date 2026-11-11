import { api } from "./api";

// Fallback ID mapping in case backend SubjectServiceImpl returns id: null
const FALLBACK_SUBJECT_IDS = {
    "DBI202": 2,
    "SWP291": 3,
    "SWP391": 8,
    "HSF302": 9,
};

// Retrieve any custom IDs saved in localStorage
export const getStoredSubjectMap = () => {
    try {
        const stored = localStorage.getItem("FUEXAM_SUBJECT_IDS");
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

// Save a subject ID mapping to localStorage
export const saveSubjectIdMapping = (subjectCode, id) => {
    if (!subjectCode || !id) return;
    try {
        const current = getStoredSubjectMap();
        current[subjectCode] = Number(id);
        localStorage.setItem("FUEXAM_SUBJECT_IDS", JSON.stringify(current));
    } catch (e) {
        console.error("Failed to save subject ID mapping:", e);
    }
};

export const normalizeSubject = (sub) => {
    if (!sub) return sub;
    const storedMap = getStoredSubjectMap();
    const resolvedId = sub.id 
        ?? sub.subjectId 
        ?? storedMap[sub.subjectCode] 
        ?? FALLBACK_SUBJECT_IDS[sub.subjectCode] 
        ?? null;

    return {
        ...sub,
        id: resolvedId,
        subjectId: resolvedId
    };
};

export const subjectService = {
    // 3.1 Danh sách, Tạo, Sửa, Xóa Môn học
    async getSubjectsByTerm(termNumber) {
        const res = await api.get(`/api/subjects/${termNumber}`);
        const data = res?.data || res || [];
        if (Array.isArray(data)) {
            const normalized = data.map(normalizeSubject);
            return res?.data ? { ...res, data: normalized } : normalized;
        }
        return res;
    },

    createSubject(data) {
        return api.post("/api/subjects", data);
    },

    updateSubject(id, data) {
        return api.put(`/api/subjects/${id}`, data);
    },

    deleteSubject(id) {
        return api.delete(`/api/subjects/${id}`);
    }
};
