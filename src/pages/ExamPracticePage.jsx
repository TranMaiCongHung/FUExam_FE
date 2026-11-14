import { 
  GraduationCap, 
  Timer, 
  X, 
  Image as ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw,
  CheckSquare,
  Award,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { practiceService } from "@/services/practiceService";
import { examService } from "@/services/examService";
import ConfirmModal from "@/shared/components/ConfirmModal";

export default function ExamPracticePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // Chế độ: 'study' (Học tập), 'exam' (Thi thử), 'review' (Xem lại bài thi)
  const queryMode = searchParams.get("mode") || "exam";
  const queryAttemptId = searchParams.get("attemptId");

  const [activeMode, setActiveMode] = useState(queryMode);
  const isStudyMode = activeMode === "study";
  const isReviewMode = activeMode === "review";

  const [showAnswersInStudy, setShowAnswersInStudy] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [reviewData, setReviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [loading, setLoading] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(queryAttemptId || null);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [allowViewImage, setAllowViewImage] = useState(false);

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") return;
    let cancelled = false;
    (async () => {
      try {
        const found = await examService.findExamById(id);
        if (!cancelled) setAllowViewImage(found?.allowViewImage === true);
      } catch (err) {
        console.error("Failed to load exam view-image setting:", err);
        if (!cancelled) setAllowViewImage(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);
  
  // Modal Popups thay thế window.confirm và alert
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  
  // Lưu các đáp án đã chọn theo dạng { questionNumber: "A" | "B" | "C" | "D" }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 phút

  // 1. Khởi tạo: Nếu vào với mode === 'review' và có attemptId, tải dữ liệu xem lại từ backend
  useEffect(() => {
    if (queryMode === "review" && queryAttemptId) {
      loadReviewData(queryAttemptId);
    } else {
      fetchQuestions();
    }
  }, [id, queryMode, queryAttemptId]);

  const loadReviewData = async (attId) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await practiceService.getAttemptReview(attId);
      const data = res?.data?.data || res?.data || res;
      setReviewData(data);
      setActiveMode("review");
      setExamStarted(true);
    } catch (err) {
      console.error("Failed to load review data:", err);
      setErrorModal("Không thể tải chi tiết bài làm để xem lại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await practiceService.getExamQuestions(id);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setQuestions(list);
    } catch (error) {
      console.error("Failed to load questions", error);
      if (error?.response?.status === 401) {
        setErrorMsg("Vui lòng đăng nhập để xem và làm bài thi này.");
      } else {
        setErrorMsg("Không thể tải danh sách câu hỏi của đề thi này.");
      }
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Chế độ học tập: tự động bắt đầu ngay khi danh sách câu hỏi được tải
  useEffect(() => {
    if (isStudyMode && questions.length > 0 && !examStarted) {
      setExamStarted(true);
    }
  }, [isStudyMode, questions.length, examStarted]);

  // Bộ đếm thời gian: Chỉ đếm ngược khi ở chế độ thi thử (exam mode)
  useEffect(() => {
    let timer;
    if (!isStudyMode && !isReviewMode && examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStudyMode, isReviewMode, examStarted, timeLeft]);

  // Hỗ trợ phím mũi tên trái / phải để chuyển câu hỏi nhanh
  useEffect(() => {
    const handleKeyDown = (e) => {
      const total = isReviewMode ? (reviewData?.questions?.length || 0) : questions.length;
      if (!examStarted || total === 0) return;
      if (e.key === "ArrowLeft") {
        setCurrentQuestion(prev => Math.max(1, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentQuestion(prev => Math.min(total, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [examStarted, questions.length, isReviewMode, reviewData]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = async () => {
    try {
      setStarting(true);
      setErrorMsg(null);
      
      // Nếu là Admin đang xem trước, bỏ qua gọi API tạo lượt thi
      const role = localStorage.getItem("role");
      if (role === 'ADMIN') {
        setAttemptId("admin-preview");
        setExamStarted(true);
        return;
      }

      const res = await practiceService.startAttempt(id);
      const attempt = res?.data?.data?.attemptId || res?.data?.attemptId || res?.attemptId;
      setAttemptId(attempt);
      setExamStarted(true);
    } catch (err) {
      console.error("Failed to start exam", err);
      setErrorMsg(err?.response?.data?.message || "Không thể bắt đầu bài thi. Vui lòng thử lại hoặc kiểm tra kết nối!");
    } finally {
      setStarting(false);
    }
  };

  // Mở modal xác nhận thay vì window.confirm
  const submitExam = () => {
    setShowConfirmSubmit(true);
  };

  // Thực hiện nộp bài sau khi người dùng bấm xác nhận trên Modal
  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false);
    try {
      setLoading(true);

      // Xây dựng danh sách câu trả lời theo đúng định dạng Map<Long, List<Long>> của backend
      const answersMap = {};
      questions.forEach((q, idx) => {
        const qNum = idx + 1;
        const selectedLabel = selectedAnswers[qNum];
        if (selectedLabel && q.answerOption) {
          const opt = q.answerOption.find((o, oIdx) => (o.optionLabel || String.fromCharCode(65 + oIdx)) === selectedLabel);
          if (opt && (opt.id || opt.id === 0)) {
            answersMap[q.id] = [opt.id];
          }
        }
      });

      if (attemptId && attemptId !== "admin-preview") {
        // Gọi API backend nộp bài thi
        const res = await practiceService.submitAttempt(attemptId, answersMap);
        const review = res?.data?.data || res?.data || res;
        
        const score = review.score ?? 0;
        const totalCorrect = review.totalCorrect ?? 0;
        const total = review.totalQuestions ?? questions.length;

        // Lưu vào lịch sử local (dự phòng trường hợp backend chưa có API lấy lịch sử)
        practiceService.saveAttemptHistory({
          attemptId: review.attemptId || attemptId,
          examId: Number(id),
          examTitle: review.examTitle || `Đề thi #${id}`,
          score: score,
          totalCorrect: totalCorrect,
          totalQuestions: total,
          finishedAt: review.finishedAt || new Date().toISOString()
        });

        setReviewData(review);
        setResultModal({
          score,
          totalCorrect,
          total,
          isAdmin: false,
          attemptId: review.attemptId || attemptId
        });
      } else {
        // Admin preview fallback
        let totalCorrect = 0;
        const total = questions.length;
        
        const reviewQuestions = questions.map((q, idx) => {
          const qNum = idx + 1;
          const selectedLabel = selectedAnswers[qNum];
          const selectedOpt = q.answerOption?.find((o, oIdx) => (o.optionLabel || String.fromCharCode(65 + oIdx)) === selectedLabel);
          const correctOpt = q.answerOption?.find(o => o.isCorrect === true || o.correct === true);
          const isCorrect = selectedOpt && correctOpt && selectedOpt.id === correctOpt.id;

          if (isCorrect) totalCorrect++;

          return {
            questionId: q.id,
            questionNumber: qNum,
            content: q.content,
            imageUrl: q.imageUrl,
            answerOptions: q.answerOption?.map((opt, oIdx) => ({
              id: opt.id || oIdx,
              optionLabel: opt.optionLabel || String.fromCharCode(65 + oIdx),
              content: opt.content,
              isCorrect: opt.isCorrect === true || opt.correct === true
            })) || [],
            userSelectedOptionIds: selectedOpt ? [selectedOpt.id] : [],
            correctOptionIds: correctOpt ? [correctOpt.id] : [],
            isCorrect: !!isCorrect
          };
        });

        const score = total > 0 ? Number(((totalCorrect / total) * 10).toFixed(2)) : 0;
        const simulatedReview = {
          attemptId: "admin-preview",
          examId: Number(id),
          examTitle: `Đề thi #${id}`,
          score,
          totalCorrect,
          totalQuestions: total,
          finishedAt: new Date().toISOString(),
          questions: reviewQuestions
        };

        setReviewData(simulatedReview);
        setResultModal({ score, totalCorrect, total, isAdmin: true, attemptId: "admin-preview" });
      }
    } catch (err) {
      console.error("Submit exam error:", err);
      setErrorModal("Đã xảy ra lỗi khi nộp bài! Vui lòng thử lại hoặc kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  // Chuyển sang màn hình xem lại bài thi sau khi nộp
  const handleOpenReview = () => {
    setResultModal(null);
    setActiveMode("review");
    setCurrentQuestion(1);
  };

  const handleSelectOption = (qNum, label) => {
    if (isReviewMode) return; // Không cho phép chọn khi đang xem lại bài
    setSelectedAnswers(prev => ({
      ...prev,
      [qNum]: label
    }));
  };

  const handleExit = () => {
    const role = localStorage.getItem("role");
    if (role === 'ADMIN') {
      navigate(`/admin/exams/${id || 1}`);
    } else {
      navigate('/');
    }
  };

  // Xác định câu hỏi hiện tại tùy theo chế độ (Review hay Làm bài)
  const totalQuestions = isReviewMode 
    ? (reviewData?.questions?.length || 0) 
    : questions.length;

  const currentQData = isReviewMode
    ? reviewData?.questions?.[currentQuestion - 1]
    : questions[currentQuestion - 1];

  const currentImage = currentQData?.imageUrl || currentQData?.image;

  return (
    <div className="h-screen w-full flex flex-col bg-neutral-50/60 overflow-hidden font-sans text-neutral-900">
      {/* Top Header */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center text-orange-600">
            <GraduationCap size={18} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-neutral-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
              {isReviewMode ? (reviewData?.examTitle || `Đề thi #${id}`) : `Đề thi #${id}`}
            </h1>
            
            {/* Mode Badge */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isReviewMode
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : isStudyMode 
                  ? "bg-neutral-100 text-neutral-700 border-neutral-200" 
                  : "bg-orange-50 text-orange-600 border-orange-200/60"
            }`}>
              {isReviewMode ? "Xem lại bài thi" : isStudyMode ? "Chế độ Học tập" : "Chế độ Thi thử"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Header Stats / Timer */}
          {isReviewMode ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold">
                <Award size={14} className="text-emerald-600" />
                <span>Điểm: {reviewData?.score ?? 0}/10</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-neutral-700 text-xs font-medium">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Đúng {reviewData?.totalCorrect ?? 0}/{reviewData?.totalQuestions ?? totalQuestions}</span>
              </div>
            </div>
          ) : !isStudyMode ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded-md text-neutral-800 text-xs sm:text-sm font-semibold shadow-2xs">
              <Timer size={15} className="text-orange-500" />
              {formatTime(timeLeft)}
            </div>
          ) : null}

          <button 
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
            title="Thoát về trang chủ"
          >
            <X size={14} />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Question Display Area */}
        <div className="flex-1 flex flex-col relative bg-neutral-50/50 overflow-hidden">
          
          {/* Button Xem ảnh gốc */}
          {examStarted && currentImage && allowViewImage && (
            <div className="absolute top-4 right-6 z-10">
              <button 
                onClick={() => setShowImageModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-neutral-700 text-xs font-medium shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 transition-colors cursor-pointer"
                title="Xem ảnh câu hỏi gốc"
              >
                <ImageIcon size={15} className="text-neutral-500" />
                <span>Xem ảnh gốc</span>
              </button>
            </div>
          )}

          {/* Main Question Display */}
          <div className="flex-1 flex flex-col p-4 sm:p-8 pt-12 sm:pt-14 overflow-y-auto">
            {loading ? (
              <div className="my-auto text-center text-neutral-400">
                <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-neutral-500">Đang tải dữ liệu câu hỏi...</p>
              </div>
            ) : totalQuestions === 0 ? (
              <div className="my-auto text-center text-neutral-400 py-12 px-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-3">
                  <AlertCircle size={22} />
                </div>
                <h3 className="text-base font-semibold text-neutral-800">
                  {errorMsg || "Đề thi chưa có câu hỏi"}
                </h3>
                <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                  {!localStorage.getItem("accessToken")
                    ? "Vui lòng đăng nhập để bắt đầu học tập và làm bài thi này."
                    : "Đề thi này hiện tại chưa có câu hỏi nào được tải lên hệ thống."}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {!localStorage.getItem("accessToken") && (
                    <button
                      onClick={() => navigate("/login")}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  )}
                  <button
                    onClick={handleExit}
                    className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            ) : !examStarted && !isReviewMode ? (
              <div className="my-auto text-center">
                <p className="text-neutral-600 font-medium mb-4 text-sm">
                  {isStudyMode ? "Sẵn sàng ôn luyện chế độ học tập?" : "Bạn đã sẵn sàng làm bài thi thử (60 phút)?"}
                </p>
                <button 
                  onClick={startExam}
                  disabled={starting}
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-md font-medium text-sm disabled:opacity-50 cursor-pointer hover:bg-orange-600 transition-colors shadow-2xs"
                >
                  {starting ? "Đang khởi tạo..." : isStudyMode ? "Bắt đầu học" : "Bắt đầu làm bài thi"}
                </button>
                {errorMsg && (
                  <p className="mt-4 text-red-500 text-xs font-medium">{errorMsg}</p>
                )}
              </div>
            ) : (
              <div className="w-full max-w-5xl mx-auto my-auto flex items-center justify-center gap-3 sm:gap-6 py-4">
                {/* Nút mũi tên bên trái */}
                <button 
                  onClick={() => setCurrentQuestion(prev => Math.max(1, prev - 1))}
                  disabled={currentQuestion === 1}
                  className="w-10 h-10 rounded-md border border-neutral-200 bg-white text-neutral-600 flex items-center justify-center shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  title="Câu trước (Phím ←)"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Component chứa nội dung câu hỏi */}
                <div className="flex-1 max-w-3xl text-left bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 shadow-2xs">
                  {/* Tiêu đề câu hỏi */}
                  <div className="mb-5 pb-3 border-b border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900">Câu {currentQuestion}:</h3>
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {currentQuestion} / {totalQuestions}
                      </span>

                      {/* Trạng thái câu trả lời trong chế độ Review */}
                      {isReviewMode && (
                        currentQData?.isCorrect ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Đúng
                          </span>
                        ) : currentQData?.userSelectedOptionIds?.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircle size={13} className="text-rose-600" />
                            Sai
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                            <AlertCircle size={13} className="text-neutral-500" />
                            Chưa trả lời
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Nội dung câu hỏi (chữ) */}
                  {currentQData?.content && (
                    <div className="text-base sm:text-lg font-normal mb-6 leading-relaxed whitespace-pre-wrap text-neutral-900">
                      {currentQData.content}
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* CÁC LỰA CHỌN ĐÁP ÁN: REVIEW MODE VS PRACTICE MODE */}
                  {/* ========================================================================= */}
                  {isReviewMode ? (
                    /* Review Mode */
                    <div className="space-y-2.5">
                      {(currentQData?.answerOptions || currentQData?.answerOption || []).map((opt, idx) => {
                        const label = opt.optionLabel || String.fromCharCode(65 + idx);
                        const isUserSelected = currentQData?.userSelectedOptionIds?.includes(opt.id);
                        const isCorrectOption = currentQData?.correctOptionIds?.includes(opt.id) || opt.isCorrect;

                        let cardStyle = "border-neutral-200 bg-white text-neutral-800";
                        let badgeStyle = "bg-neutral-100 text-neutral-700 border border-neutral-200";
                        let statusTag = null;

                        if (isUserSelected && isCorrectOption) {
                          cardStyle = "bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-2xs";
                          badgeStyle = "bg-emerald-600 text-white font-bold";
                          statusTag = (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={13} strokeWidth={2} />
                              Bạn đã chọn (Đúng)
                            </span>
                          );
                        } else if (isUserSelected && !isCorrectOption) {
                          cardStyle = "bg-rose-50/70 border-rose-400 text-rose-950 shadow-2xs";
                          badgeStyle = "bg-rose-600 text-white font-bold";
                          statusTag = (
                            <span className="text-xs font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                              <XCircle size={13} strokeWidth={2} />
                              Bạn đã chọn (Sai)
                            </span>
                          );
                        } else if (!isUserSelected && isCorrectOption) {
                          cardStyle = "bg-emerald-50/40 border-emerald-500 border-dashed text-emerald-950";
                          badgeStyle = "bg-emerald-500 text-white font-bold";
                          statusTag = (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                              <Check size={13} strokeWidth={2} />
                              Đáp án đúng
                            </span>
                          );
                        }

                        return (
                          <div
                            key={opt.id || idx}
                            className={`flex items-center gap-3.5 p-3 rounded-md border transition-all ${cardStyle}`}
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs shrink-0 ${badgeStyle}`}>
                              {label}
                            </div>
                            <span className="text-sm sm:text-base leading-snug flex-1">
                              {opt.content}
                            </span>
                            {statusTag}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Practice Mode (Study & Exam) */
                    <div className="space-y-2.5">
                      {(currentQData?.answerOption || []).map((opt, idx) => {
                        const label = opt.optionLabel || String.fromCharCode(65 + idx);
                        const isSelected = selectedAnswers[currentQuestion] === label;
                        const isCorrect = opt.isCorrect === true || opt.correct === true;
                        const hasAnsweredInStudy = isStudyMode && !!selectedAnswers[currentQuestion];

                        // Khi ở Chế độ học tập và đã chọn đáp án
                        if (hasAnsweredInStudy) {
                          let cardStyle = "border-neutral-200 bg-white text-neutral-800 opacity-60";
                          let badgeStyle = "bg-neutral-100 text-neutral-700 border border-neutral-200";

                          if (isSelected && isCorrect) {
                            cardStyle = "bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-2xs opacity-100";
                            badgeStyle = "bg-emerald-600 text-white font-bold";
                          } else if (isSelected && !isCorrect) {
                            cardStyle = "bg-rose-50/70 border-rose-400 text-rose-950 shadow-2xs opacity-100";
                            badgeStyle = "bg-rose-600 text-white font-bold";
                          } else if (!isSelected && isCorrect) {
                            cardStyle = "bg-emerald-50/40 border-emerald-500 border-dashed text-emerald-950 opacity-100";
                            badgeStyle = "bg-emerald-500 text-white font-bold";
                          }

                          return (
                            <div
                              key={opt.id || idx}
                              onClick={() => handleSelectOption(currentQuestion, label)}
                              className={`flex items-center gap-3.5 p-3 rounded-md border transition-all cursor-pointer select-none ${cardStyle}`}
                            >
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs shrink-0 ${badgeStyle}`}>
                                {label}
                              </div>
                              <span className="text-sm sm:text-base leading-snug flex-1 font-normal">
                                {opt.content}
                              </span>
                            </div>
                          );
                        }

                        // Mặc định (khi chưa chọn hoặc ở Exam Mode)
                        return (
                          <div 
                            key={opt.id || idx} 
                            onClick={() => handleSelectOption(currentQuestion, label)}
                            className={`flex items-center gap-3.5 p-3 rounded-md border transition-all cursor-pointer select-none ${
                              isSelected 
                                ? "bg-orange-50/40 border-orange-500 shadow-2xs" 
                                : "border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${
                              isSelected 
                                ? "bg-orange-500 text-white font-bold" 
                                : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                            }`}>
                              {label}
                            </div>
                            <span className={`text-sm sm:text-base leading-snug flex-1 ${
                              isSelected ? "font-medium text-neutral-900" : "text-neutral-800"
                            }`}>
                              {opt.content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nút mũi tên bên phải */}
                <button 
                  onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1))}
                  disabled={currentQuestion === totalQuestions}
                  className="w-10 h-10 rounded-md border border-neutral-200 bg-white text-neutral-600 flex items-center justify-center shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  title="Câu tiếp theo (Phím →)"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Question Palette */}
        <div className="w-64 sm:w-72 flex flex-col border-l border-neutral-200 bg-white">
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase mb-4">
              {isReviewMode ? "BẢNG KẾT QUẢ BÀI THI" : "QUESTION PALETTE"}
            </h2>

            <div className="grid grid-cols-5 gap-2">
              {isReviewMode ? (
                /* Palette trong chế độ Review */
                (reviewData?.questions || []).map((q, idx) => {
                  const qNum = idx + 1;
                  const isCurrent = currentQuestion === qNum;
                  const isCorrect = q.isCorrect === true;
                  const hasAnswered = q.userSelectedOptionIds && q.userSelectedOptionIds.length > 0;

                  let bgClass = "bg-white border-neutral-200 text-neutral-400";
                  if (isCorrect) {
                    bgClass = "bg-emerald-500 border-emerald-600 text-white font-semibold";
                  } else if (hasAnswered) {
                    bgClass = "bg-rose-500 border-rose-600 text-white font-semibold";
                  } else {
                    bgClass = "bg-neutral-100 border-neutral-200 text-neutral-500 font-medium";
                  }

                  return (
                    <button 
                      key={idx}
                      onClick={() => setCurrentQuestion(qNum)}
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-xs shadow-2xs border transition-colors cursor-pointer ${bgClass} ${
                        isCurrent ? "ring-2 ring-neutral-900 ring-offset-1" : ""
                      }`}
                      title={`Câu ${qNum}: ${isCorrect ? "Đúng" : hasAnswered ? "Sai" : "Chưa làm"}`}
                    >
                      {qNum}
                    </button>
                  );
                })
              ) : (
                /* Palette trong chế độ làm bài thi */
                questions.map((q, idx) => {
                  const qNum = idx + 1;
                  const isCurrent = currentQuestion === qNum;
                  const isAnswered = !!selectedAnswers[qNum];
                  
                  let bgClass = "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50";
                  
                  if (isStudyMode && isAnswered) {
                    const selectedLabel = selectedAnswers[qNum];
                    const correctOpt = q.answerOption?.find(o => o.isCorrect === true || o.correct === true);
                    const correctLabel = correctOpt ? (correctOpt.optionLabel || String.fromCharCode(65 + q.answerOption.indexOf(correctOpt))) : null;
                    if (selectedLabel === correctLabel) {
                      bgClass = "bg-emerald-500 border-emerald-600 text-white font-semibold";
                    } else {
                      bgClass = "bg-rose-500 border-rose-600 text-white font-semibold";
                    }
                  } else if (isCurrent) {
                    bgClass = "bg-neutral-900 border-neutral-900 text-white font-bold ring-2 ring-neutral-900/20";
                  } else if (isAnswered) {
                    bgClass = "bg-neutral-100 border-neutral-300 text-neutral-900 font-medium";
                  }

                  return (
                    <button 
                      key={idx}
                      onClick={() => setCurrentQuestion(qNum)}
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-xs shadow-2xs border cursor-pointer transition-colors ${bgClass} ${
                        isCurrent && isStudyMode && isAnswered ? "ring-2 ring-neutral-900 ring-offset-1" : ""
                      }`}
                    >
                      {qNum}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Palette Legend & Actions (Ẩn trong Chế độ Học tập) */}
          {!isStudyMode && (
            <div className="p-4 border-t border-neutral-200 bg-white relative flex flex-col gap-4">
              {isReviewMode ? (
                /* Legend cho chế độ Review */
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                    <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></div>
                    Câu đúng ({reviewData?.totalCorrect ?? 0})
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                    <div className="w-2.5 h-2.5 rounded-xs bg-rose-500"></div>
                    Câu sai ({(reviewData?.totalQuestions ?? totalQuestions) - (reviewData?.totalCorrect ?? 0)})
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <div className="w-2.5 h-2.5 rounded-xs bg-neutral-200 border border-neutral-300"></div>
                    Chưa trả lời
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleExit}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-medium text-xs rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={14} />
                      <span>Quay về danh sách đề</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Legend cho chế độ thi thử (Exam Mode) */
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                      <div className="w-2.5 h-2.5 rounded-xs bg-neutral-900"></div>
                      Đang chọn
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                      <div className="w-2.5 h-2.5 rounded-xs bg-neutral-300"></div>
                      Đã trả lời
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-xs border border-neutral-300 bg-white"></div>
                      Chưa trả lời
                    </div>
                  </div>
                  
                  {examStarted && (
                    <button 
                      onClick={submitExam}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs sm:text-sm rounded-md transition-colors shadow-2xs mt-2 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} />
                      <span>Nộp bài</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && currentImage && allowViewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-5xl max-h-[90vh] flex flex-col overflow-hidden w-full border border-neutral-200">
            <div className="flex justify-between items-center p-4 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-900">Ảnh câu hỏi gốc</h3>
              <button 
                onClick={() => setShowImageModal(false)} 
                className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex justify-center items-center bg-neutral-50">
              <img 
                src={currentImage} 
                alt="Original Question" 
                className="max-w-full max-h-[75vh] object-contain border border-neutral-200 rounded-md" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận nộp bài */}
      <ConfirmModal
        isOpen={showConfirmSubmit}
        title="Xác nhận nộp bài thi"
        message={
          Object.keys(selectedAnswers).length < questions.length
            ? `Bạn mới chỉ trả lời ${Object.keys(selectedAnswers).length}/${questions.length} câu hỏi. Vẫn còn câu hỏi chưa có đáp án!\n\nBạn có chắc chắn muốn nộp bài thi ngay bây giờ không?`
            : `Bạn đã hoàn thành đủ tất cả ${questions.length} câu hỏi!\n\nBạn có chắc chắn muốn nộp bài thi ngay bây giờ không?`
        }
        type="question"
        confirmText="Nộp bài"
        cancelText="Làm tiếp"
        confirmButtonClass="bg-orange-500 hover:bg-orange-600 text-white rounded-md"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />

      {/* Modal thông báo kết quả bài thi sau khi nộp */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full p-6 text-center space-y-4">
            
            {/* Top Icon */}
            <div className="w-12 h-12 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-2xs">
              <Award size={28} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900">Hoàn thành bài thi!</h3>
              <p className="text-xs text-neutral-400 mt-1">Kết quả bài thi thử của bạn đã được ghi nhận vào hệ thống.</p>
            </div>

            {/* Score Card */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md text-center space-y-1.5">
              <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                <span className="text-emerald-600">{resultModal.score}</span> <span className="text-sm font-medium text-neutral-500">/ 10 điểm</span>
              </div>
              <div className="text-xs font-medium text-neutral-600">
                Số câu trả lời đúng: <strong className="text-neutral-900">{resultModal.totalCorrect}</strong> / {resultModal.total} câu
              </div>
              {resultModal.isAdmin && (
                <div className="text-[11px] text-neutral-400 pt-1">
                  (Chế độ xem trước của Quản trị viên)
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleOpenReview}
                className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-medium text-xs sm:text-sm rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckSquare size={16} />
                <span>Xem lại bài thi đã làm</span>
              </button>

              <button
                onClick={handleExit}
                className="w-full py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-medium text-xs rounded-md transition-colors cursor-pointer"
              >
                Về danh sách đề thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông báo lỗi khi nộp bài */}
      <ConfirmModal
        isOpen={!!errorModal}
        title="Thông báo"
        message={errorModal}
        type="danger"
        confirmText="Đóng"
        hideCancel={true}
        onConfirm={() => setErrorModal(null)}
        onCancel={() => setErrorModal(null)}
      />
    </div>
  );
}
