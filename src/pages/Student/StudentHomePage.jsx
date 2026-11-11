import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  Play, 
  BookMarked, 
  LogOut, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  Info,
  X,
  History,
  Eye,
  CheckSquare,
  LogIn
} from "lucide-react";
import { examService } from "@/services/examService";
import { subjectService } from "@/services/subjectService";
import { authService } from "@/services/authService";
import { practiceService } from "@/services/practiceService";

const SEMESTERS = [
  { name: "Kỳ 1", value: 1 }, { name: "Kỳ 2", value: 2 }, { name: "Kỳ 3", value: 3 },
  { name: "Kỳ 4", value: 4 }, { name: "Kỳ 5", value: 5 }, { name: "Kỳ 6", value: 6 },
  { name: "Kỳ 7", value: 7 }, { name: "Kỳ 8", value: 8 }, { name: "Kỳ 9", value: 9 }
];

export default function StudentHomePage() {
  const navigate = useNavigate();

  // Authentication & User info
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("role") || "USER";
  const username = localStorage.getItem("username") || "Sinh viên";

  // Selection states
  const activeSemesterStored = parseInt(localStorage.getItem("STUDENT_ACTIVE_SEMESTER") || "5", 10);
  const [activeSemester, setActiveSemester] = useState(activeSemesterStored || 5);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Exam list & filters
  const [exams, setExams] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("ALL"); // ALL, FE, PE
  const examsRequestIdRef = useRef(0);

  // Selected Exam for Mode Selection Modal
  const [selectedExamModal, setSelectedExamModal] = useState(null);
  
  // Selected Exam for History Modal
  const [historyModalExam, setHistoryModalExam] = useState(null);

  // 1. Fetch subjects when curriculum semester changes
  useEffect(() => {
    localStorage.setItem("STUDENT_ACTIVE_SEMESTER", activeSemester);
    // Reset ngay lập tức đề thi và môn đang chọn khi đổi kỳ để tránh dữ liệu rác
    setSelectedSubjectId(null);
    setExams([]);
    fetchSubjects(activeSemester);
  }, [activeSemester]);

  const fetchSubjects = async (term) => {
    try {
      setLoadingSubjects(true);
      const res = await subjectService.getSubjectsByTerm(term);
      const list = res?.data || res || [];
      const safeList = Array.isArray(list) ? list : [];
      
      // Lọc bỏ những môn học bị ẩn / tắt (DISABLE) khỏi giao diện sinh viên
      const activeSubjects = safeList.filter(s => {
        const status = (s.status || "ENABLE").toUpperCase();
        return status !== "DISABLE";
      });

      setSubjects(activeSubjects);

      if (activeSubjects.length > 0) {
        // Giữ nguyên môn học người dùng đang chọn nếu môn đó nằm trong học kỳ này và vẫn đang ENABLE
        const savedSubId = localStorage.getItem("STUDENT_SELECTED_SUBJECT_ID");
        const matched = activeSubjects.find(s => String(s.id ?? s.subjectId ?? s.subjectCode) === String(savedSubId));

        if (matched) {
          const chosenId = matched.id ?? matched.subjectId ?? matched.subjectCode;
          setSelectedSubjectId(chosenId);
        } else {
          const firstId = activeSubjects[0].id ?? activeSubjects[0].subjectId ?? activeSubjects[0].subjectCode;
          setSelectedSubjectId(firstId);
          localStorage.setItem("STUDENT_SELECTED_SUBJECT_ID", firstId);
        }
      } else {
        setSelectedSubjectId(null);
        localStorage.removeItem("STUDENT_SELECTED_SUBJECT_ID");
        setExams([]);
      }
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setSubjects([]);
      setSelectedSubjectId(null);
      localStorage.removeItem("STUDENT_SELECTED_SUBJECT_ID");
      setExams([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // 2. Fetch exams when selected subject or exam type changes
  useEffect(() => {
    if (selectedSubjectId) {
      fetchExams(selectedSubjectId, examTypeFilter);
    } else {
      setExams([]);
    }
  }, [selectedSubjectId, examTypeFilter]);

  const fetchExams = async (subId, type) => {
    if (!subId) {
      setExams([]);
      return;
    }
    const currentRequestId = ++examsRequestIdRef.current;
    try {
      setLoadingExams(true);
      const numericId = !isNaN(Number(subId)) ? Number(subId) : undefined;
      const res = await examService.getExams(0, 50, {
        subjectId: numericId,
        examType: type !== "ALL" ? type : undefined
      });
      // Chỉ cập nhật nếu request này là mới nhất
      if (currentRequestId === examsRequestIdRef.current) {
        const examList = res?.data?.content || res?.content || res?.data || res || [];
        setExams(Array.isArray(examList) ? examList : []);
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
      if (currentRequestId === examsRequestIdRef.current) {
        setExams([]);
      }
    } finally {
      if (currentRequestId === examsRequestIdRef.current) {
        setLoadingExams(false);
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const handleStartPractice = (examId, mode) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { state: { from: { pathname: `/exams/${examId}/practice`, search: `?mode=${mode}` } } });
      return;
    }
    navigate(`/exams/${examId}/practice?mode=${mode}`);
  };

  const handleOpenHistory = (exam) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setHistoryModalExam(exam);
  };

  const selectedSubject = subjects.find(s => (s.id ?? s.subjectId ?? s.subjectCode) === selectedSubjectId);

  // Filter exams by search term - Chỉ hiển thị khi có môn học hợp lệ trong học kỳ
  const filteredExams = (!selectedSubject || subjects.length === 0)
    ? []
    : exams.filter(exam => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const title = (exam.title || "").toLowerCase();
        const desc = (exam.description || "").toLowerCase();
        const sem = (exam.semesterCode || "").toLowerCase();
        const subCode = (exam.subjectCode || "").toLowerCase();
        return title.includes(term) || desc.includes(term) || sem.includes(term) || subCode.includes(term);
      });

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      {/* Top Student Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 border-b border-neutral-100 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-2xs">
              <GraduationCap size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-extrabold text-xl text-neutral-900 tracking-tight">FUExam</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                Student Portal
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <>
                {userRole === "ADMIN" && (
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200 transition-colors cursor-pointer"
                    title="Chuyển sang trang Quản trị viên"
                  >
                    <Shield size={14} className="text-orange-600" />
                    <span>Trang Admin</span>
                  </button>
                )}

                <div className="flex items-center gap-2 pl-3 border-l border-neutral-100">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-700">
                    {username.charAt(0).toUpperCase()}
                  </div>

                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-neutral-800 truncate max-w-[120px]">{username}</div>
                    <div className="text-[10px] text-neutral-400">Sinh viên FPT</div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer ml-1"
                    title="Đăng xuất"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Student Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Curriculum Semester & Subjects Selection */}
        <div className="border border-neutral-200 rounded-lg p-3.5 sm:p-4 bg-white shadow-2xs space-y-3">
          {/* Semester Row */}
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
                        setSelectedSubjectId(null);
                        setExams([]);
                        localStorage.setItem("STUDENT_ACTIVE_SEMESTER", sem.value);
                        localStorage.removeItem("STUDENT_SELECTED_SUBJECT_ID");
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

          {/* Subjects Row */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0 min-w-[76px] whitespace-nowrap">
              Môn học
            </span>
            {loadingSubjects ? (
              <span className="text-xs text-neutral-400 py-1">Đang tải danh sách môn học...</span>
            ) : subjects.length === 0 ? (
              <span className="text-xs text-neutral-400 italic py-1">
                Chưa có môn học nào được cập nhật trong học kỳ này.
              </span>
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
                        localStorage.setItem("STUDENT_SELECTED_SUBJECT_ID", subId);
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

        {/* Search & Exam Type Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm đề thi..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
            />
          </div>

          {/* Exam Type Filters */}
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

        {/* Exam Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <BookMarked size={18} className="text-neutral-700" />
              {selectedSubject ? (
                <span>Đề thi môn <span className="font-bold text-neutral-900">{selectedSubject.subjectCode}</span></span>
              ) : (
                <span>Danh sách đề thi</span>
              )}
            </h2>
            <span className="text-xs text-neutral-400">
              {filteredExams.length} đề thi
            </span>
          </div>

          {loadingExams ? (
            <div className="py-16 text-center text-neutral-400">
              <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-neutral-500">Đang tải danh sách đề thi...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-16 text-center bg-white border border-neutral-200 rounded-lg p-8 shadow-2xs">
              <GraduationCap size={44} className="mx-auto text-neutral-300 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-neutral-800">Chưa có đề thi nào phù hợp</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {subjects.length === 0 
                  ? "Học kỳ này hiện chưa có môn học hoặc đề thi nào khả dụng."
                  : searchTerm 
                    ? "Không tìm thấy đề thi phù hợp với từ khóa tìm kiếm của bạn." 
                    : "Môn học này hiện chưa có đề thi được tải lên hệ thống."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const examId = exam.id ?? exam.examId;
                const isFE = exam.examType === "FE";
                const attemptCount = practiceService.getAttemptHistory(examId, 3).length;

                return (
                  <div
                    key={examId}
                    className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-5 shadow-2xs hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          isFE 
                            ? "bg-orange-50 text-orange-600 border-orange-200/60" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        }`}>
                          {exam.examType || "FE"}
                        </span>

                        {exam.semesterCode && (
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {exam.semesterCode}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 
                        onClick={() => setSelectedExamModal(exam)}
                        className="font-semibold text-base text-neutral-900 group-hover:text-orange-600 transition-colors cursor-pointer line-clamp-1 leading-snug"
                        title={exam.title}
                      >
                        {exam.title || "Đề thi không có tiêu đề"}
                      </h3>

                      <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {exam.description || "Đề thi trắc nghiệm ôn tập kiến thức."}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2.5">
                      {/* 2 Chế độ làm bài */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStartPractice(examId, "study")}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <BookOpen size={14} className="text-neutral-500" />
                          <span>Học tập</span>
                        </button>

                        <button
                          onClick={() => handleStartPractice(examId, "exam")}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                        >
                          <Play size={13} className="fill-white" />
                          <span>Thi thử</span>
                        </button>
                      </div>

                      {/* Dòng phụ: Ngày tải + Lịch sử + Chi tiết */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {exam.createdAt || exam.uploadDate ? new Date(exam.createdAt || exam.uploadDate).toLocaleDateString() : "2026"}
                        </span>

                        <div className="flex items-center gap-3">
                          {attemptCount > 0 && (
                            <button
                              onClick={() => handleOpenHistory(exam)}
                              className="text-neutral-600 hover:text-neutral-900 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                              title="Xem lại các lần làm bài gần nhất"
                            >
                              <History size={12} className="text-orange-500" />
                              <span>Lịch sử ({attemptCount})</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedExamModal(exam)}
                            className="font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT ĐỀ THI & LỰA CHỌN CHẾ ĐỘ THI */}
      {/* ========================================================================= */}
      {selectedExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="relative bg-white rounded-lg shadow-xl border border-neutral-200 max-w-lg w-full p-6 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedExamModal(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                selectedExamModal.examType === "FE"
                  ? "bg-orange-50 text-orange-600 border-orange-200/60" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              }`}>
                {selectedExamModal.examType || "FE"}
              </span>
              {selectedExamModal.semesterCode && (
                <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-md">
                  {selectedExamModal.semesterCode}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-neutral-900 leading-snug">
              {selectedExamModal.title || "Chi tiết đề thi"}
            </h3>

            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              {selectedExamModal.description || "Đề thi ôn luyện trắc nghiệm. Vui lòng chọn chế độ làm bài phù hợp với nhu cầu của bạn:"}
            </p>

            {/* Mode Option Cards */}
            <div className="mt-5 space-y-2.5">
              {/* Option 1: Chế độ Học tập */}
              <div 
                onClick={() => {
                  const id = selectedExamModal.id ?? selectedExamModal.examId;
                  setSelectedExamModal(null);
                  handleStartPractice(id, "study");
                }}
                className="flex items-start gap-3.5 p-3.5 rounded-md border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/60 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 mt-0.5">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">
                      Chế độ Học tập
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      Tự do
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Không giới hạn thời gian và không cần nộp bài. Tự do xem gợi ý đáp án theo nhịp độ của bạn.
                  </p>
                </div>
              </div>

              {/* Option 2: Chế độ Thi thử */}
              <div 
                onClick={() => {
                  const id = selectedExamModal.id ?? selectedExamModal.examId;
                  setSelectedExamModal(null);
                  handleStartPractice(id, "exam");
                }}
                className="flex items-start gap-3.5 p-3.5 rounded-md border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/60 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-md bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                  <Play size={17} className="fill-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">
                      Chế độ Thi thử
                    </h4>
                    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                      Bấm giờ 60p
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Mô phỏng kỳ thi với đồng hồ đếm ngược 60 phút, kết thúc làm bài sẽ nộp và tính điểm.
                  </p>
                </div>
              </div>

              {/* Option 3: Lịch sử làm bài thi */}
              <div 
                onClick={() => {
                  const examToReview = selectedExamModal;
                  setSelectedExamModal(null);
                  handleOpenHistory(examToReview);
                }}
                className="flex items-start gap-3.5 p-3.5 rounded-md border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/60 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 mt-0.5">
                  <History size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-neutral-900 group-hover:text-orange-600 transition-colors">
                      Lịch sử làm bài
                    </h4>
                    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                      Xem lại
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Xem lại các bài thi thử bạn đã hoàn thành, đối chiếu từng câu đúng/sai và lời giải.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setSelectedExamModal(null)}
                className="px-4 py-2 rounded-md border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LỊCH SỬ LÀM BÀI THI & XEM LẠI BÀI ĐÃ LÀM */}
      {/* ========================================================================= */}
      {historyModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="relative bg-white rounded-lg shadow-xl border border-neutral-200 max-w-lg w-full p-6 overflow-hidden text-left flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHistoryModalExam(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                <History size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900">Lịch sử làm bài</h3>
                  <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                    3 lần gần nhất
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate max-w-[340px]">
                  {historyModalExam.title || `Đề thi #${historyModalExam.id ?? historyModalExam.examId}`}
                </p>
              </div>
            </div>

            {/* Attempts List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 my-2 flex-1">
              {(() => {
                const examId = historyModalExam.id ?? historyModalExam.examId;
                const attempts = practiceService.getAttemptHistory(examId, 3);

                if (attempts.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 border border-dashed border-neutral-200 rounded-lg space-y-3">
                      <Clock size={36} className="mx-auto text-neutral-300" />
                      <div className="text-sm font-semibold text-neutral-800">Chưa có lịch sử làm bài</div>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                        Bạn chưa hoàn thành bài thi thử nào cho đề thi này. Hãy bắt đầu thi thử để ghi nhận kết quả nhé!
                      </p>
                      <button
                        onClick={() => {
                          setHistoryModalExam(null);
                          navigate(`/exams/${examId}/practice?mode=exam`);
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 mt-1"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Bắt đầu thi thử</span>
                      </button>
                    </div>
                  );
                }

                return attempts.map((att, idx) => (
                  <div 
                    key={att.attemptId || idx}
                    className="p-3.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50/60 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-800">
                          Lần thi {idx === 0 ? "gần nhất" : `#${idx + 1}`}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                            Mới nhất
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400">
                          {att.finishedAt ? new Date(att.finishedAt).toLocaleString('vi-VN') : "Vừa xong"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {att.score ?? 0} / 10 điểm
                        </span>
                        <span className="text-neutral-500 font-medium text-[11px]">
                          Đúng: <strong className="text-neutral-800">{att.totalCorrect ?? 0}</strong> / {att.totalQuestions ?? 0} câu
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setHistoryModalExam(null);
                        navigate(`/exams/${examId}/practice?mode=review&attemptId=${att.attemptId}`);
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Xem lại bài thi đã làm"
                    >
                      <Eye size={13} />
                      <span>Xem lại</span>
                    </button>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryModalExam(null)}
                className="px-4 py-2 rounded-md border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        FUExam Platform · FPT University Student Learning Hub
      </footer>
    </div>
  );
}
