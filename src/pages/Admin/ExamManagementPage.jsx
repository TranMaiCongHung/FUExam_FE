import { Search, Plus, BookOpen, Calendar, ChevronRight, Eye, Trash2, X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { examService } from "@/services/examService";
import { subjectService, saveSubjectIdMapping } from "@/services/subjectService";
import MessageToast from "@/shared/components/MessageToast";
import ConfirmModal from "@/shared/components/ConfirmModal";

const SEMESTERS = [
  { name: "Kỳ 1", value: 1 }, { name: "Kỳ 2", value: 2 }, { name: "Kỳ 3", value: 3 },
  { name: "Kỳ 4", value: 4 }, { name: "Kỳ 5", value: 5 }, { name: "Kỳ 6", value: 6 },
  { name: "Kỳ 7", value: 7 }, { name: "Kỳ 8", value: 8 }, { name: "Kỳ 9", value: 9 }
];

const SUGGESTED_SEMESTER_CODES = ["SP25", "SU25", "FA25", "SP26", "SU26", "FA26"];

export default function ExamManagementPage() {
  const navigate = useNavigate();

  // Page selection states
  const savedAdminSem = parseInt(localStorage.getItem("ADMIN_ACTIVE_SEMESTER") || "5", 10);
  const [activeSemester, setActiveSemester] = useState(savedAdminSem || 5);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    return localStorage.getItem("ADMIN_SELECTED_SUBJECT_ID") || null;
  });

  // Exam list & filters
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("ALL"); // ALL, FE, PE

  // Notification Toast
  const [toast, setToast] = useState({ type: "success", message: "" });

  // Modal Popup xác nhận thay thế window.confirm
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "question",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    confirmButtonClass: "",
    onConfirm: () => {}
  });

  // Create Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSemester, setModalSemester] = useState(1);
  const [modalSubjects, setModalSubjects] = useState([]);
  const [loadingModalSubjects, setLoadingModalSubjects] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    description: "",
    examType: "FE",
    semesterCode: ""
  });
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [showManualIdInput, setShowManualIdInput] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected subject object
  const selectedSubject = subjects.find(
    s => (s.id ?? s.subjectId ?? s.subjectCode) === selectedSubjectId
  ) || null;

  // Load subjects when active semester changes
  useEffect(() => {
    fetchSubjects(activeSemester);
  }, [activeSemester]);

  // Load exams when selectedSubject or examTypeFilter changes
  useEffect(() => {
    const subTargetId = selectedSubject?.id || selectedSubjectId;
    if (subTargetId) {
      fetchExams(subTargetId, examTypeFilter);
    } else {
      setExams([]);
    }
  }, [selectedSubjectId, selectedSubject, examTypeFilter]);

  const fetchSubjects = async (termNumber) => {
    try {
      setLoadingSubjects(true);
      const res = await subjectService.getSubjectsByTerm(termNumber);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setSubjects(list);
      if (list.length > 0) {
        const savedSubId = localStorage.getItem("ADMIN_SELECTED_SUBJECT_ID");
        const matched = list.find(s => String(s.id ?? s.subjectId ?? s.subjectCode) === String(savedSubId));
        if (matched) {
          const chosenId = matched.id ?? matched.subjectId ?? matched.subjectCode;
          setSelectedSubjectId(chosenId);
        } else {
          const firstId = list[0].id ?? list[0].subjectId ?? list[0].subjectCode;
          setSelectedSubjectId(firstId);
          localStorage.setItem("ADMIN_SELECTED_SUBJECT_ID", firstId);
        }
      } else {
        setSelectedSubjectId(null);
      }
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setToast({ type: "error", message: "Không thể tải danh sách môn học cho kỳ này." });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchExams = async (subId, type = examTypeFilter) => {
    try {
      setLoadingExams(true);
      const numericId = typeof subId === "number" ? subId : (Number(subId) || undefined);
      const res = await examService.getExams(0, 100, {
        subjectId: numericId,
        examType: type !== "ALL" ? type : undefined
      });
      const examList = res?.data?.content || res?.content || res?.data || res || [];
      const safeList = Array.isArray(examList) ? examList : [];
      safeList.forEach(item => {
        const itemId = item.id ?? item.examId;
        if (itemId) {
          try {
            localStorage.setItem(`EXAM_${itemId}_INFO`, JSON.stringify(item));
          } catch (_) {}
        }
      });
      setExams(safeList);
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleDeleteExam = (examId) => {
    if (!examId) return;
    setModalConfig({
      isOpen: true,
      title: "Xác nhận xóa đề thi",
      message: "Bạn có chắc chắn muốn xóa bài thi này không? Toàn bộ câu hỏi liên quan sẽ bị xóa khỏi hệ thống.",
      type: "danger",
      confirmText: "Xóa đề thi",
      cancelText: "Hủy",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await examService.deleteExam(examId);
          setToast({ type: "success", message: "Đã xóa bài thi thành công!" });
          const subTargetId = selectedSubject?.id || selectedSubjectId;
          if (subTargetId) {
            fetchExams(subTargetId, examTypeFilter);
          }
        } catch (err) {
          console.error("Failed to delete exam:", err);
          setToast({
            type: "error",
            message: err.response?.data?.message || err.message || "Xóa đề thi thất bại."
          });
        }
      }
    });
  };

  // Open Create Exam Modal
  const openCreateModal = async () => {
    const defaultSem = selectedSubject?.termNumber || activeSemester;
    setModalSemester(defaultSem);
    setFormError("");
    setShowManualIdInput(false);
    setManualSubjectId("");

    let currentModalSubjects = [];
    if (defaultSem === activeSemester && subjects.length > 0) {
      currentModalSubjects = subjects;
      setModalSubjects(subjects);
    } else {
      try {
        setLoadingModalSubjects(true);
        const res = await subjectService.getSubjectsByTerm(defaultSem);
        const data = res?.data || res || [];
        currentModalSubjects = Array.isArray(data) ? data : [];
        setModalSubjects(currentModalSubjects);
      } catch (err) {
        console.error("Error loading subjects in modal:", err);
      } finally {
        setLoadingModalSubjects(false);
      }
    }

    const initialSubjectId = selectedSubject?.id 
      ?? selectedSubject?.subjectId 
      ?? (currentModalSubjects.length > 0 ? (currentModalSubjects[0].id ?? currentModalSubjects[0].subjectId ?? currentModalSubjects[0].subjectCode) : "");

    setFormData({
      subjectId: initialSubjectId ? String(initialSubjectId) : "",
      title: "",
      description: "",
      examType: "FE",
      semesterCode: ""
    });

    setIsModalOpen(true);
  };

  // Handle changing semester inside modal
  const handleModalSemesterChange = async (e) => {
    const sem = Number(e.target.value);
    setModalSemester(sem);
    setShowManualIdInput(false);
    setManualSubjectId("");
    try {
      setLoadingModalSubjects(true);
      const res = await subjectService.getSubjectsByTerm(sem);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setModalSubjects(list);
      const newSubjectId = list.length > 0 ? (list[0].id ?? list[0].subjectId ?? list[0].subjectCode ?? "") : "";
      setFormData(prev => ({
        ...prev,
        subjectId: newSubjectId ? String(newSubjectId) : ""
      }));
    } catch (err) {
      console.error("Error changing modal semester:", err);
    } finally {
      setLoadingModalSubjects(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "semesterCode" ? value.toUpperCase().replace(/\s/g, "") : value
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.subjectId) {
      setFormError("Vui lòng chọn môn học cho bài thi.");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("Vui lòng nhập tên đề thi (Exam Title).");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Vui lòng nhập mô tả cho đề thi.");
      return;
    }

    const semesterCodeRegex = /^(FA|SU|SP)\d{2}$/i;
    if (!formData.semesterCode.trim() || !semesterCodeRegex.test(formData.semesterCode.trim())) {
      setFormError("Mã học kỳ (Semester Code) phải có định dạng FA/SU/SP + 2 số năm (ví dụ: FA24, SP25, SU24).");
      return;
    }

    // Resolve subject ID
    const targetSub = modalSubjects.find(
      s => String(s.id) === String(formData.subjectId) || String(s.subjectId) === String(formData.subjectId) || s.subjectCode === formData.subjectId
    );
    let resolvedSubjectId = targetSub?.id ?? targetSub?.subjectId ?? Number(formData.subjectId) ?? null;

    if (!resolvedSubjectId || isNaN(Number(resolvedSubjectId))) {
      if (manualSubjectId && !isNaN(Number(manualSubjectId))) {
        resolvedSubjectId = Number(manualSubjectId);
        if (targetSub?.subjectCode) {
          saveSubjectIdMapping(targetSub.subjectCode, resolvedSubjectId);
        }
      } else {
        setShowManualIdInput(true);
        setFormError("Môn học này chưa có ID từ Backend. Vui lòng nhập ID số trong CSDL (ví dụ: 9) vào ô bên dưới để tiếp tục.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        examType: formData.examType,
        semesterCode: formData.semesterCode.trim().toUpperCase()
      };

      const res = await examService.createExam(resolvedSubjectId, payload);
      const createdExam = res?.data || res;
      const createdExamId = createdExam?.id;

      setIsModalOpen(false);
      setToast({ type: "success", message: "Tạo đề thi mới thành công!" });

      // If user created an exam for another semester or subject, switch to it
      if (modalSemester !== activeSemester) {
        setActiveSemester(modalSemester);
        setSelectedSubjectId(resolvedSubjectId);
      } else if (selectedSubjectId !== resolvedSubjectId) {
        setSelectedSubjectId(resolvedSubjectId);
      } else {
        fetchExams(resolvedSubjectId, examTypeFilter);
      }

      // Prompt to navigate to detail page to import questions
      if (createdExamId) {
        const fullExamData = {
          id: createdExamId,
          title: formData.title,
          description: formData.description,
          examType: formData.examType,
          semesterCode: formData.semesterCode,
          ...createdExam
        };
        try {
          localStorage.setItem(`EXAM_${createdExamId}_INFO`, JSON.stringify(fullExamData));
        } catch (_) {}

        setModalConfig({
          isOpen: true,
          title: "Tạo đề thi thành công!",
          message: "Đề thi đã được tạo thành công! Bạn có muốn chuyển đến trang đề thi để tải ảnh và trích xuất câu hỏi ngay bây giờ không?",
          type: "success",
          confirmText: "Chuyển đến đề thi ngay",
          cancelText: "Ở lại trang này",
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            navigate(`/admin/exams/${createdExamId}`, { state: { exam: fullExamData } });
          }
        });
      }
    } catch (err) {
      console.error("Failed to create exam:", err);
      const errorMsg = err.response?.data?.message || err.message || "Tạo đề thi thất bại. Vui lòng kiểm tra lại.";
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter exams by search term
  const filteredExams = exams.filter(exam => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (exam.title || "").toLowerCase();
    const desc = (exam.description || "").toLowerCase();
    const sem = (exam.semesterCode || "").toLowerCase();
    return title.includes(term) || desc.includes(term) || sem.includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <MessageToast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, message: "" })}
      />

      {/* Modal Popup xác nhận thay thế window.confirm */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        confirmButtonClass={modalConfig.confirmButtonClass}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Quản lý Đề thi</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Duyệt học kỳ, chọn môn học và quản lý kho đề thi qua các kỳ của hệ thống.
        </p>
      </div>

      {/* Top Bar: Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đề thi theo tiêu đề, kỳ thi (FA24, SP25)..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
          />
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 shadow-xs cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Tạo đề thi mới</span>
        </button>
      </div>

      {/* Selection Panel: Kỳ học & Môn học đồng nhất với Student Portal */}
      <div className="border border-neutral-200 rounded-lg p-3.5 sm:p-4 bg-white shadow-2xs space-y-3">
        {/* Semester selector */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0 min-w-[76px] whitespace-nowrap">
            Học kỳ
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SEMESTERS.map(sem => {
              const isActive = activeSemester === sem.value;
              return (
                <button 
                  key={sem.value} 
                  onClick={() => {
                    if (activeSemester !== sem.value) {
                      setActiveSemester(sem.value);
                      localStorage.setItem("ADMIN_ACTIVE_SEMESTER", sem.value);
                      localStorage.removeItem("ADMIN_SELECTED_SUBJECT_ID");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-neutral-900 text-white font-semibold shadow-2xs" 
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {sem.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100"></div>

        {/* Subjects selector */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0 min-w-[76px] whitespace-nowrap">
            Môn học
          </span>
          {loadingSubjects ? (
            <span className="text-xs text-neutral-400 py-1">Đang tải danh sách môn học...</span>
          ) : subjects.length === 0 ? (
            <span className="text-xs text-neutral-400 italic py-1">Chưa có môn học nào trong học kỳ này.</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {subjects.map(sub => {
                const subId = sub.id ?? sub.subjectId ?? sub.subjectCode;
                const isSelected = selectedSubjectId === subId;
                return (
                  <button 
                    key={subId}
                    onClick={() => {
                      setSelectedSubjectId(subId);
                      localStorage.setItem("ADMIN_SELECTED_SUBJECT_ID", subId);
                    }}
                    title={sub.subjectName || sub.subjectCode}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-orange-500 text-white font-semibold shadow-xs hover:bg-orange-600"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    }`}
                  >
                    {sub.subjectCode}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Archive Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <BookOpen size={18} className="text-neutral-700" />
            <span>
              {selectedSubject 
                ? <>Kho đề thi môn <span className="font-bold text-neutral-900">{selectedSubject.subjectCode}</span></>
                : `Kho đề thi học kỳ ${activeSemester}`}
            </span>
          </h2>

          {/* Filter buttons: All, FE, PE */}
          <div className="flex items-center gap-1 p-1 rounded-md bg-neutral-100 text-xs shrink-0 self-start sm:self-auto">
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "FE", value: "FE" },
              { label: "PE", value: "PE" }
            ].map(type => (
              <button 
                key={type.value}
                onClick={() => setExamTypeFilter(type.value)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  examTypeFilter === type.value 
                    ? "bg-white text-neutral-900 font-semibold shadow-xs" 
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-500 text-[11px] font-semibold tracking-wider uppercase border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5">KỲ THI / LOẠI</th>
                  <th className="px-6 py-3.5">TIÊU ĐỀ ĐỀ THI</th>
                  <th className="px-6 py-3.5">NGÀY TẠO</th>
                  <th className="px-6 py-3.5 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-900">
                {loadingExams ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-neutral-400">
                      <div className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-2"></div>
                      <p>Đang tải danh sách đề thi...</p>
                    </td>
                  </tr>
                ) : !selectedSubject ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-neutral-400">
                      Chưa chọn môn học hoặc học kỳ này chưa có môn học. Vui lòng chọn môn học ở trên.
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-neutral-400">
                      Chưa có đề thi nào cho môn học này. Hãy nhấn &quot;Tạo đề thi mới&quot; để tạo đề thi!
                    </td>
                  </tr>
                ) : filteredExams.map(exam => {
                  const examId = exam.id || exam.examId || exam._id || exam.exam_id;
                  return (
                    <tr key={examId || Math.random()} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{exam.semesterCode || "N/A"}</span>
                          {exam.examType && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              exam.examType === "PE" 
                                ? "bg-purple-50 text-purple-700 border border-purple-200" 
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {exam.examType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-neutral-900">{exam.title || "Untitled Exam"}</div>
                        <div className="text-xs text-neutral-400 mt-0.5 max-w-md truncate">{exam.description || "Không có mô tả"}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Calendar size={13} className="text-neutral-400" />
                          {(exam.createdAt || exam.uploadDate) ? new Date(exam.createdAt || exam.uploadDate).toLocaleDateString() : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => {
                              if (!examId) {
                                setToast({ type: "error", message: "Dữ liệu từ server bị thiếu ID của bài thi. Vui lòng kiểm tra lại!" });
                                return;
                              }
                              try {
                                localStorage.setItem(`EXAM_${examId}_INFO`, JSON.stringify(exam));
                              } catch (_) {}
                              navigate(`/admin/exams/${examId}`, { state: { exam } });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteExam(examId)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa đề thi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Tạo đề thi mới</h3>
                  <p className="text-xs text-neutral-400">Tạo đề thi mới và gán vào môn học</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span className="leading-snug">{formError}</span>
                </div>
              )}

              {/* Semester & Subject Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Học kỳ đào tạo
                  </label>
                  <select
                    value={modalSemester}
                    onChange={handleModalSemesterChange}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 transition-colors shadow-2xs"
                  >
                    {SEMESTERS.map(sem => (
                      <option key={sem.value} value={sem.value}>{sem.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Môn học <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId || ""}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowManualIdInput(false);
                      setFormError("");
                    }}
                    disabled={loadingModalSubjects || modalSubjects.length === 0}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 transition-colors shadow-2xs disabled:opacity-50"
                    required
                  >
                    {loadingModalSubjects ? (
                      <option value="">Đang tải môn học...</option>
                    ) : modalSubjects.length === 0 ? (
                      <option value="">-- Chưa có môn học --</option>
                    ) : (
                      modalSubjects.map(sub => {
                        const optVal = sub.id ?? sub.subjectId ?? sub.subjectCode;
                        return (
                          <option key={optVal} value={String(optVal)}>
                            {sub.subjectCode} - {sub.subjectName}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              {/* Manual ID Input fallback */}
              {showManualIdInput && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 text-xs text-amber-900">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>⚠️ Môn học này chưa có ID từ Backend. Nhập ID số trong CSDL:</span>
                  </div>
                  <input
                    type="number"
                    value={manualSubjectId}
                    onChange={(e) => setManualSubjectId(e.target.value)}
                    placeholder="Nhập ID số (VD: 9)..."
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <p className="text-[11px] text-amber-700">
                    ID này sẽ được ghi nhớ tự động, bạn chỉ cần nhập 1 lần duy nhất.
                  </p>
                </div>
              )}

              {modalSubjects.length === 0 && !loadingModalSubjects && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  ⚠️ Học kỳ này chưa có môn học nào. Vui lòng chọn học kỳ khác hoặc vào <strong>Quản lý Môn học</strong> để tạo môn học trước.
                </p>
              )}

              {/* Exam Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Tiêu đề đề thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: PRN211 Final Exam Summer 2024..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors shadow-2xs"
                  required
                />
              </div>

              {/* Exam Type & Semester Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Loại đề thi <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, examType: "FE" }))}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        formData.examType === "FE"
                          ? "bg-white text-neutral-900 font-bold shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      FE
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, examType: "PE" }))}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        formData.examType === "PE"
                          ? "bg-white text-neutral-900 font-bold shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      PE
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Mã kỳ thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="semesterCode"
                    value={formData.semesterCode}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: FA24, SP25..."
                    maxLength={4}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm font-semibold text-neutral-900 uppercase transition-colors shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Quick suggestions for Semester Code */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-neutral-400">Gợi ý nhanh:</span>
                {SUGGESTED_SEMESTER_CODES.map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, semesterCode: code }))}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer ${
                      formData.semesterCode === code
                        ? "bg-neutral-900 text-white font-semibold border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Mô tả đề thi <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Mô tả đề thi, hướng dẫn làm bài hoặc thông tin bổ sung..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 resize-none transition-colors shadow-2xs"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || modalSubjects.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-xs">⌛</span>
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Tạo đề thi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
