import { ArrowLeft, Play, Upload, Image as ImageIcon, Info, Settings2, Save, Sparkles, Trash2, Check, X, AlertCircle, Plus, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { questionService } from "@/services/questionService";
import { practiceService } from "@/services/practiceService";
import { examService } from "@/services/examService";
import MessageToast from "@/shared/components/MessageToast";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AddQuestionModal from "@/pages/Admin/components/AddQuestionModal";
import { validateQuestion } from "@/pages/Admin/utils/questionValidation";

export default function ExamDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [exam, setExam] = useState(() => {
    if (location.state?.exam) {
      try {
        localStorage.setItem(`EXAM_${id}_INFO`, JSON.stringify(location.state.exam));
      } catch (_) {}
      return location.state.exam;
    }
    try {
      const cached = localStorage.getItem(`EXAM_${id}_INFO`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });

  const [isImportMode, setIsImportMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [toast, setToast] = useState({ type: "success", message: "" });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    confirmButtonClass: "",
    onConfirm: () => {}
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const isSavingRef = useRef(false);
  const fileInputRef = useRef(null);

  // Helper trích xuất objectKey từ URL R2/S3 nếu cần
  const extractKeyFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const match = url.indexOf("exams/");
    return match !== -1 ? url.substring(match) : null;
  };

  useEffect(() => {
    if (id && id !== "undefined" && id !== "null") {
      fetchQuestions();
      fetchExamInfo();
    }
  }, [id]);

  const fetchExamInfo = async () => {
    if (!id || id === "undefined" || id === "null") return;
    try {
      const res = await examService.getExams(0, 100);
      const data = res?.data || res;
      const list = data?.content || (Array.isArray(data) ? data : []);
      const found = list.find(e => String(e.id ?? e.examId) === String(id));
      if (found) {
        setExam(found);
        try {
          localStorage.setItem(`EXAM_${id}_INFO`, JSON.stringify(found));
        } catch (_) {}
      }
    } catch (err) {
      console.error("Failed to load exam details:", err);
    }
  };

  const fetchQuestions = async ({ keepDrafts = true, keepDirtyIds = null } = {}) => {
    if (!id || id === "undefined" || id === "null") return;
    try {
      const res = await practiceService.getExamQuestions(id);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];

      // Retrieve cached correct answers from localStorage if backend masked them
      let correctCache = {};
      try {
        const raw = localStorage.getItem(`EXAM_${id}_CORRECT_ANSWERS`);
        if (raw) correctCache = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse correct answer cache:", e);
      }

      const mergedList = list.map((q, idx) => {
        const qNum = q.questionNumber ?? idx + 1;
        const cachedLabels = correctCache[qNum] || [];

        // Check if backend already sent at least one correct answer
        const backendHasCorrect = q.answerOption?.some(
          opt => opt.isCorrect === true || opt.correct === true
        );

        let options = q.answerOption || [];
        if (!backendHasCorrect && cachedLabels.length > 0) {
          options = options.map((opt, oIdx) => {
            const label = opt.optionLabel || String.fromCharCode(65 + oIdx);
            const isMatch = cachedLabels.includes(label);
            return {
              ...opt,
              isCorrect: isMatch,
              correct: isMatch
            };
          });
        }

        return {
          ...q,
          questionNumber: qNum,
          objectKey: q.objectKey || extractKeyFromUrl(q.imageUrl),
          answerOption: options,
          _dirty: false
        };
      }).sort((a, b) => a.questionNumber - b.questionNumber);

      setQuestions(prev => {
        const dirtyById = new Map(
          prev
            .filter(q => q.id && q._dirty && (keepDirtyIds ? keepDirtyIds.has(q.id) : true))
            .map(q => [q.id, q])
        );
        const merged = mergedList.map(q => dirtyById.get(q.id) || q);
        const drafts = keepDrafts ? prev.filter(q => !q.id) : [];
        return [...merged, ...drafts];
      });
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const handleDeleteQuestion = (questionId, index) => {
    if (!questionId) {
      setModalConfig({
        isOpen: true,
        title: "Xóa câu hỏi",
        message: "Câu hỏi này chưa được lưu, bạn có chắc chắn muốn xóa khỏi giao diện?",
        type: "danger",
        confirmText: "Xóa",
        cancelText: "Hủy",
        onConfirm: () => {
          setQuestions(prev => prev.filter((_, i) => i !== index));
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    
    setModalConfig({
      isOpen: true,
      title: "Xác nhận xóa câu hỏi",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi hệ thống?",
      type: "danger",
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await questionService.deleteQuestion(id, questionId);
          setToast({ type: "success", message: "Đã xóa câu hỏi thành công." });
          fetchQuestions();
        } catch (err) {
          console.error("Error deleting question:", err);
          setToast({ type: "error", message: err?.message || "Lỗi khi xóa câu hỏi." });
        }
      }
    });
  };

  const draftCount = questions.filter(q => !q.id).length;

  const handleClearAllQuestions = () => {
    if (draftCount === 0) return;
    setModalConfig({
      isOpen: true,
      title: "Xóa câu hỏi chưa lưu",
      message: `Bạn có chắc chắn muốn xóa ${draftCount} câu hỏi chưa lưu khỏi giao diện không?\n\n(Các câu hỏi đã lưu trên hệ thống không bị ảnh hưởng và phải được xóa từng câu một.)`,
      type: "danger",
      confirmText: "Xóa câu chưa lưu",
      cancelText: "Hủy",
      onConfirm: () => {
        setQuestions(prev => prev.filter(q => q.id));
        setToast({ type: "info", message: "Đã xóa các câu hỏi chưa lưu." });
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Mọi chỉnh sửa câu hỏi đều đi qua helper này; câu đã lưu (có id) được đánh dấu _dirty
  const updateQuestionAt = (qIndex, updater) => {
    setQuestions(prev => {
      if (!prev[qIndex]) return prev;
      const next = [...prev];
      const updated = updater({ ...prev[qIndex] });
      next[qIndex] = prev[qIndex].id ? { ...updated, _dirty: true } : updated;
      return next;
    });
  };

  const handleChangeQuestionType = (qIndex, newType) => {
    const q = questions[qIndex];
    if (!q) return;
    const correctCount = (q.answerOption || []).filter(o => o.isCorrect === true || o.correct === true).length;
    const clear = newType === "SINGLE_CHOICE" && correctCount > 1;
    updateQuestionAt(qIndex, target => ({
      ...target,
      questionType: newType,
      answerOption: clear
        ? (target.answerOption || []).map(o => ({ ...o, isCorrect: false, correct: false }))
        : target.answerOption
    }));
    if (clear) {
      setToast({ type: "info", message: "Câu hỏi một đáp án chỉ có 1 đáp án đúng. Vui lòng chọn lại đáp án đúng." });
    }
  };

  // Toggle correct answer for question options (Chỉ cho phép khi ở chế độ Edit)
  const handleToggleCorrectAnswer = (qIndex, oIndex) => {
    if (!isEditMode) return;
    updateQuestionAt(qIndex, targetQ => {
      const options = [...(targetQ.answerOption || [])];
      const isMulti = targetQ.questionType === "MULTIPLE_CHOICE";

      targetQ.answerOption = options.map((opt, idx) => {
        const currentlyCorrect = opt.isCorrect === true || opt.correct === true;
        if (idx === oIndex) {
          const newVal = isMulti ? !currentlyCorrect : true;
          return { ...opt, isCorrect: newVal, correct: newVal };
        }
        return isMulti ? opt : { ...opt, isCorrect: false, correct: false };
      });
      return targetQ;
    });
  };

  // Thêm một trường đáp án mới cho câu hỏi (VD: thêm D hoặc E nếu OCR bị thiếu)
  const handleAddOption = (qIndex) => {
    if (!isEditMode) return;
    updateQuestionAt(qIndex, targetQ => {
      const currentOptions = targetQ.answerOption || [];
      targetQ.answerOption = [
        ...currentOptions,
        {
          optionLabel: String.fromCharCode(65 + currentOptions.length),
          content: "",
          isCorrect: false,
          correct: false
        }
      ];
      return targetQ;
    });
  };

  // Xóa một trường đáp án và tự động đánh lại nhãn A, B, C...
  const handleDeleteOption = (qIndex, oIndex) => {
    if (!isEditMode) return;
    const currentOptions = questions[qIndex]?.answerOption || [];
    if (currentOptions.length <= 2) {
      setToast({ type: "error", message: "Mỗi câu hỏi cần có ít nhất 2 đáp án!" });
      return;
    }
    updateQuestionAt(qIndex, targetQ => {
      targetQ.answerOption = (targetQ.answerOption || [])
        .filter((_, idx) => idx !== oIndex)
        .map((opt, idx) => ({ ...opt, optionLabel: String.fromCharCode(65 + idx) }));
      return targetQ;
    });
  };

  const processFiles = async (filesList) => {
    if (!filesList || !filesList.length) return;
    const rawFiles = Array.from(filesList);
    // Filter only images
    const files = rawFiles.filter(f => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name));
    
    if (!files.length) {
      setToast({ type: "error", message: "Vui lòng chỉ tải lên các tệp định dạng hình ảnh (.png, .jpg, .webp...)" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_UPLOAD = 30;
    if (files.length > MAX_UPLOAD) {
      setToast({ type: "error", message: `Vui lòng tải lên tối đa ${MAX_UPLOAD} ảnh mỗi lần để đảm bảo hệ thống hoạt động ổn định.` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!id || id === "undefined" || id === "null") {
      setToast({ type: "error", message: "Lỗi: Mã đề thi (ID) không hợp lệ!" });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress({ current: 0, total: files.length });

      const CHUNK_SIZE = 1;
      let allExtractedData = [];
      let failedCount = 0;

      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        try {
          const res = await questionService.extractOcr(id, chunk);
          const extractedData = res?.data || res || [];
          
          const mappedChunk = (Array.isArray(extractedData) ? extractedData : []).map((q, chunkIndex) => {
            // Normalize answer options and ensure isCorrect flag is properly mapped from OCR
            const answerOptions = (q.answerOption || []).map(opt => ({
              ...opt,
              isCorrect: opt.isCorrect === true || opt.correct === true,
              correct: opt.isCorrect === true || opt.correct === true
            }));

            const localUrl = chunk[chunkIndex] ? URL.createObjectURL(chunk[chunkIndex]) : null;
            const objKey = q.objectKey || extractKeyFromUrl(q.imageUrl);

            return {
              ...q,
              objectKey: objKey,
              imageUrl: q.imageUrl || localUrl,
              localPreview: localUrl,
              answerOption: answerOptions
            };
          });
          
          if (mappedChunk.length > 0) {
            allExtractedData = [...allExtractedData, ...mappedChunk];
            // Cập nhật câu hỏi theo thời gian thực (ảnh nào xong nạp ngay câu hỏi đó vào bảng)
            // Câu OCR là bản nháp (chưa có id), số câu sẽ do backend gán khi lưu
            setQuestions(prev => [...prev, ...mappedChunk.map(q => ({ ...q, id: undefined }))]);
          }
        } catch (chunkErr) {
          console.error(`Lỗi bóc tách ảnh thứ ${i + 1}:`, chunkErr);
          failedCount++;
        }
        
        setUploadProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, files.length) }));
      }

      if (allExtractedData.length > 0) {
        setIsImportMode(false);
        if (failedCount > 0) {
          setToast({ 
            type: "warning", 
            message: `Đã bóc tách thành công ${allExtractedData.length} câu hỏi (${failedCount} ảnh bị lỗi). Hãy kiểm tra lại trước khi bấm Lưu.` 
          });
        } else {
          setToast({ 
            type: "success", 
            message: `Đã trích xuất thành công toàn bộ ${allExtractedData.length} câu hỏi! Hãy kiểm tra lại đáp án đúng trước khi bấm Lưu.` 
          });
        }
      } else {
        setToast({ 
          type: "error", 
          message: "Không thể trích xuất câu hỏi từ các ảnh đã chọn. Vui lòng kiểm tra lại định dạng ảnh hoặc thử lại." 
        });
      }
      
    } catch (err) {
      console.error("OCR extract error:", err);
      setToast({ type: "error", message: err?.message || "Đã xảy ra sự cố trong quá trình phân tích ảnh. Vui lòng thử lại." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target?.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const buildQuestionBody = (q, questionNumber) => {
    const objKey = q.objectKey || extractKeyFromUrl(q.imageUrl) || null;
    return {
      questionNumber,
      content: q.content || "",
      questionType: q.questionType || "SINGLE_CHOICE",
      objectKey: objKey,
      imageUrl: q.imageUrl || null,
      answerOption: (q.answerOption || []).map((opt, oIdx) => {
        const isOptCorrect = opt.isCorrect === true || opt.correct === true || opt.is_correct === true
          || String(opt.isCorrect) === "true" || String(opt.correct) === "true";
        return {
          optionLabel: opt.optionLabel || String.fromCharCode(65 + oIdx),
          content: opt.content || "",
          isCorrect: isOptCorrect,
          correct: isOptCorrect
        };
      })
    };
  };

  const handleSaveQuestions = async () => {
    if (isSavingRef.current || isSaving) return;

    const drafts = questions.filter(q => !q.id);
    const dirty = questions.filter(q => q.id && q._dirty);
    if (drafts.length === 0 && dirty.length === 0) {
      setToast({ type: "info", message: "Không có thay đổi nào để lưu" });
      return;
    }

    // Validate
    const label = (q) => (q.id ? `#${q.questionNumber}` : "mới");
    const validationLines = [];
    [...dirty, ...drafts].forEach(q => {
      const errs = validateQuestion({
        content: q.content,
        hasImage: !!(q.imageUrl || q.objectKey || q.localPreview),
        questionType: q.questionType || "SINGLE_CHOICE",
        answerOption: q.answerOption
      });
      errs.forEach(e => validationLines.push(`Câu ${label(q)}: ${e}`));
    });
    if (validationLines.length > 0) {
      setToast({ type: "error", message: validationLines.join("\n") });
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const failures = [];
      const failedIds = new Set();
      const savedNumbers = {}; // questionNumber -> correct labels
      const correctLabelsOf = (body) => body.answerOption.filter(o => o.isCorrect).map(o => o.optionLabel);

      // Bước 1: cập nhật tuần tự các câu đã lưu bị sửa
      for (const q of dirty) {
        const body = buildQuestionBody(q, q.questionNumber);
        try {
          await questionService.updateQuestion(id, q.id, body);
          savedNumbers[q.questionNumber] = correctLabelsOf(body);
        } catch (err) {
          console.error("Update question error:", err);
          failedIds.add(q.id);
          failures.push(`Câu #${q.questionNumber}: ${err?.message || "Lỗi không xác định"}`);
        }
      }

      // Bước 2: thêm các câu nháp (backend tự gán số câu từ max+1)
      let bulkSucceeded = false;
      if (drafts.length > 0) {
        const bulkPayload = drafts.map(q => buildQuestionBody(q, null));
        try {
          await questionService.saveBulkQuestions(id, bulkPayload);
          bulkSucceeded = true;
          let nextNum = questions
            .filter(q => q.id)
            .reduce((m, q) => Math.max(m, Number(q.questionNumber) || 0), 0);
          bulkPayload.forEach(body => {
            nextNum += 1;
            savedNumbers[nextNum] = correctLabelsOf(body);
          });
        } catch (err) {
          console.error("Bulk save error:", err);
          failures.push(`Thêm câu hỏi mới: ${err?.message || "Lỗi không xác định"}`);
        }
      }

      // Gộp cache đáp án đúng
      try {
        const raw = localStorage.getItem(`EXAM_${id}_CORRECT_ANSWERS`);
        const cache = raw ? JSON.parse(raw) : {};
        localStorage.setItem(`EXAM_${id}_CORRECT_ANSWERS`, JSON.stringify({ ...cache, ...savedNumbers }));
      } catch (e) {
        console.error("Failed to update correct answer cache:", e);
      }

      await fetchQuestions({ keepDrafts: !bulkSucceeded, keepDirtyIds: failedIds });

      if (failures.length === 0) {
        setToast({ type: "success", message: "Đã lưu thay đổi thành công!" });
      } else {
        setToast({ type: "error", message: "Một số thay đổi chưa được lưu:\n" + failures.join("\n") });
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
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

      <AddQuestionModal
        isOpen={isAddModalOpen}
        examId={id}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={() => {
          setIsAddModalOpen(false);
          setToast({ type: "success", message: "Đã thêm câu hỏi" });
          fetchQuestions();
        }}
      />

      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <button
              onClick={() => navigate("/admin/exams")}
              className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 text-xs font-semibold transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={15} />
              Quay lại danh sách đề thi
            </button>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
              Chi tiết Đề thi: {exam?.title || `#${id}`}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/exams/${id || 1}/practice?mode=study`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
              title="Chế độ Học tập (không giới hạn thời gian)"
            >
              <BookOpen size={14} className="text-orange-500" />
              <span>Học tập</span>
            </button>
            <button
              onClick={() => navigate(`/exams/${id || 1}/practice?mode=exam`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
              title="Chế độ Thi thử (bấm giờ 60p, nộp bài)"
            >
              <Play size={14} />
              <span>Thi thử</span>
            </button>
            <button
              onClick={() => setIsImportMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Upload size={14} />
              <span>Tải ảnh OCR</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Thêm câu hỏi</span>
            </button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-500 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <BookOpenIcon size={15} className="text-neutral-400" />
            <span>Quản lý Đề thi</span>
          </div>
          <div className="w-px h-3.5 bg-neutral-200"></div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-neutral-400" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="w-px h-3.5 bg-neutral-200"></div>
          <div className="font-semibold text-neutral-800">
            {questions.length} <span className="font-normal text-neutral-400">câu hỏi</span>
          </div>
          {exam?.semesterCode && (
            <>
              <div className="w-px h-3.5 bg-neutral-200"></div>
              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold text-[11px] border border-neutral-200">
                {exam.semesterCode}
              </span>
            </>
          )}
          {exam?.examType && (
            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
              exam.examType === "FE" 
                ? "bg-blue-50 text-blue-700 border border-blue-200" 
                : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}>
              {exam.examType}
            </span>
          )}
        </div>
      </div>

      {/* Upload Question Images Section (Visible when Import Mode is ON) */}
      {isImportMode && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
              <Upload size={16} className="text-orange-500" />
              <span>Tải ảnh đề thi & Phân tích OCR</span>
            </div>
            <button 
              onClick={() => setIsImportMode(false)} 
              className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
              isUploading 
                ? "cursor-wait opacity-80 border-neutral-300 bg-neutral-50/50" 
                : isDragging
                ? "cursor-copy border-orange-500 bg-orange-50/60 ring-4 ring-orange-500/10 scale-[1.008]"
                : "cursor-pointer border-neutral-300 bg-neutral-50/50 hover:bg-orange-50/20 hover:border-orange-300"
            }`}
          >
            {isUploading ? (
              <div className="w-full max-w-md mx-auto">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-900 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-orange-500 animate-pulse" />
                    <span>Đang tải lên và phân tích AI OCR...</span>
                  </div>
                  <span>{Math.min(uploadProgress.current, uploadProgress.total)} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress.total > 0 ? Math.min((uploadProgress.current / uploadProgress.total) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-neutral-400 text-xs mt-3 text-center">Vui lòng đợi, quá trình bóc tách OCR có thể mất một chút thời gian...</p>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  isDragging 
                    ? "bg-orange-500 text-white shadow-xs" 
                    : "bg-orange-50 border border-orange-100 text-orange-500 shadow-2xs"
                }`}>
                  <ImageIcon size={22} />
                </div>
                <p className="text-neutral-900 font-bold text-sm">
                  {isDragging ? "Thả ảnh vào đây để tải lên..." : "Kéo & thả ảnh câu hỏi vào đây hoặc bấm để chọn"}
                </p>
                <p className="text-neutral-400 text-xs mt-1">Hỗ trợ .png · .jpg · .webp (tối đa 30 ảnh)</p>
              </>
            )}
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-start gap-2 text-xs text-neutral-600">
            <Info size={15} className="mt-0.5 shrink-0 text-neutral-400" />
            <p>AI Gemini sẽ tự động nhận diện nội dung câu hỏi, các lựa chọn A/B/C/D và gợi ý đáp án đúng. Bạn có thể bật chế độ Chỉnh sửa để điều chỉnh nội dung hoặc đổi đáp án đúng trước khi bấm Lưu thay đổi.</p>
          </div>
        </div>
      )}

      {/* Questions List Section */}
      {questions.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
              <GraduationCapIcon size={18} className="text-neutral-600" />
              <span>Danh sách câu hỏi</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md text-xs font-semibold ml-2 border border-neutral-200">
                {questions.length} câu
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleClearAllQuestions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={draftCount === 0}
                title="Xóa các câu hỏi chưa lưu"
              >
                <Trash2 size={14} />
                <span>Xóa câu chưa lưu ({draftCount})</span>
              </button>
              <button 
                onClick={() => setIsEditMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isEditMode 
                    ? "bg-neutral-900 border-neutral-900 text-white shadow-2xs" 
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-2xs"
                }`}
              >
                <Settings2 size={14} />
                <span>{isEditMode ? "Thoát chế độ sửa" : "Chỉnh sửa câu hỏi"}</span>
              </button>
              <button
                onClick={handleSaveQuestions}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white hover:bg-orange-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Save size={14} />
                <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </div>

          {/* List of Questions */}
          <div className="p-5 space-y-6">
            {questions.map((q, qIndex) => (
              <div key={q.id || `q_${qIndex}`} className="flex flex-col lg:flex-row gap-6 border-b border-neutral-100 pb-6 last:border-0 last:pb-0">
                {/* Left: Image Preview */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-neutral-900 text-white font-bold text-xs shadow-2xs">
                      {q.id ? `#${q.questionNumber ?? qIndex + 1}` : "Mới"}
                    </div>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id, qIndex)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {(q.imageUrl || q.localPreview || q.image) ? (
                    <div className="border border-neutral-200 bg-neutral-50/50 p-2 rounded-lg">
                      <img 
                        src={q.imageUrl || q.localPreview || q.image} 
                        alt={`Question ${q.questionNumber ?? qIndex + 1}`} 
                        className="w-full h-auto rounded-md object-contain max-h-[320px] mx-auto"
                        onError={(e) => {
                          if (q.localPreview && e.target.src !== q.localPreview) {
                            e.target.src = q.localPreview;
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border border-neutral-200 bg-neutral-50 p-8 rounded-lg text-center text-neutral-400 text-xs">
                      Không có hình ảnh đính kèm
                    </div>
                  )}
                </div>

                {/* Right: OCR Content & Answer Options */}
                <div className="flex-1 space-y-4">
                  {/* OCR Extraction Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-neutral-900 font-semibold text-xs">
                        <Sparkles size={14} className="text-orange-500" />
                        <span>Nội dung câu hỏi</span>
                      </div>
                      {isEditMode ? (
                        <select
                          value={q.questionType || "SINGLE_CHOICE"}
                          onChange={(e) => handleChangeQuestionType(qIndex, e.target.value)}
                          className="px-2 py-0.5 bg-white border border-neutral-300 focus:border-neutral-900 text-neutral-900 rounded text-[10px] font-bold uppercase cursor-pointer focus:outline-none"
                        >
                          <option value="SINGLE_CHOICE">1 đáp án đúng</option>
                          <option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase border border-neutral-200">
                          {q.questionType === "MULTIPLE_CHOICE" ? "Nhiều đáp án đúng" : "1 đáp án đúng"}
                        </span>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        className="w-full h-24 p-3 border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 bg-white rounded-lg resize-y focus:outline-none text-xs text-neutral-900"
                        placeholder="Nội dung câu hỏi trích xuất từ OCR..."
                        value={q.content || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateQuestionAt(qIndex, t => ({ ...t, content: value }));
                        }}
                      ></textarea>
                    ) : (
                      <div className="w-full min-h-[50px] p-3 border border-neutral-200 bg-neutral-50/50 rounded-lg text-xs sm:text-sm text-neutral-900 whitespace-pre-wrap select-text leading-relaxed">
                        {q.content || <span className="text-neutral-400 italic">Chưa có nội dung câu hỏi</span>}
                      </div>
                    )}
                  </div>

                  {/* MCQ Answers Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                        CÁC LỰA CHỌN ĐÁP ÁN
                      </span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm text-neutral-900">
                      {q.answerOption?.map((opt, oIndex) => {
                        const isOptCorrect = opt.isCorrect === true || opt.correct === true || opt.is_correct === true
                          || String(opt.isCorrect) === "true" || String(opt.correct) === "true";
                        const label = opt.optionLabel || String.fromCharCode(65 + oIndex);

                        return (
                          <div
                            key={opt.id || oIndex}
                            onClick={() => {
                              if (isEditMode) {
                                handleToggleCorrectAnswer(qIndex, oIndex);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-all select-none ${
                              isEditMode 
                                ? "cursor-pointer" 
                                : "cursor-default"
                            } ${
                              isOptCorrect 
                                ? "bg-emerald-50/80 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/30" 
                                : isEditMode 
                                  ? "border-neutral-200 bg-white hover:bg-emerald-50/20 hover:border-emerald-300"
                                  : "border-neutral-200 bg-white"
                            }`}
                          >
                            {/* Radio / Check indicator */}
                            <div className={`relative flex items-center justify-center w-4 h-4 rounded-full border transition-colors shrink-0 ${
                              isOptCorrect 
                                ? "border-emerald-600 bg-emerald-600 text-white" 
                                : "border-neutral-300 bg-white"
                            }`}>
                              {isOptCorrect && <Check size={10} strokeWidth={3} />}
                            </div>

                            {/* Option Label (A, B, C, D) */}
                            <span className={`font-bold text-xs w-4 shrink-0 ${
                              isOptCorrect ? "text-emerald-700" : "text-neutral-500"
                            }`}>
                              {label}
                            </span>

                            {/* Option Content */}
                            {isEditMode ? (
                              <input
                                type="text"
                                placeholder={`Nhập nội dung đáp án ${label}...`}
                                value={opt.content || ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateQuestionAt(qIndex, t => {
                                    const opts = [...t.answerOption];
                                    opts[oIndex] = { ...opts[oIndex], content: value };
                                    return { ...t, answerOption: opts };
                                  });
                                }}
                                className="flex-1 px-2.5 py-1 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900"
                              />
                            ) : (
                              <span className={`flex-1 leading-snug text-xs sm:text-sm ${
                                isOptCorrect ? "font-semibold text-emerald-950" : "text-neutral-800"
                              }`}>
                                {opt.content || <span className="text-neutral-400 italic text-xs">(Chưa có nội dung)</span>}
                              </span>
                            )}

                            {/* Delete Option button in edit mode */}
                            {isEditMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOption(qIndex, oIndex);
                                }}
                                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                                title={`Xóa đáp án ${label}`}
                              >
                                <X size={13} />
                              </button>
                            )}

                            {/* Correct Badge */}
                            {isOptCorrect && (
                              <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Nút (+) Thêm trường đáp án trong Edit Mode */}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50/50 hover:border-orange-400 rounded-lg text-xs font-bold transition-all cursor-pointer w-full justify-center shadow-2xs mt-2"
                        >
                          <Plus size={15} />
                          <span>Thêm trường đáp án ({String.fromCharCode(65 + (q.answerOption?.length || 0))})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Missing icons helper
function BookOpenIcon(props) { 
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function CalendarIcon(props) { 
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}
function GraduationCapIcon(props) { 
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a2 2 0 0 0-.019-3.838L12.83 4.18a2 2 0 0 0-1.66 0L2.6 7.08a2 2 0 0 0 0 3.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>;
}
