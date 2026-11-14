import { useState, useEffect } from "react";
import { X, Plus, Trash2, ImageIcon } from "lucide-react";
import { questionService } from "@/services/questionService";
import { validateQuestion } from "@/pages/Admin/utils/questionValidation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

const defaultOptions = () =>
  ["A", "B", "C", "D"].map(l => ({ optionLabel: l, content: "", correct: false }));

export default function AddQuestionModal({ isOpen, examId, onClose, onCreated }) {
  const [questionNumber, setQuestionNumber] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState("");
  const [content, setContent] = useState("");
  const [questionType, setQuestionType] = useState("SINGLE_CHOICE");
  const [options, setOptions] = useState(defaultOptions);
  const [typeHint, setTypeHint] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Reset form mỗi lần mở
  useEffect(() => {
    if (isOpen) {
      setQuestionNumber("");
      setImageFile(null);
      setImageError("");
      setContent("");
      setQuestionType("SINGLE_CHOICE");
      setOptions(defaultOptions());
      setTypeHint("");
      setErrors([]);
      setSubmitError("");
      setIsSending(false);
    }
  }, [isOpen]);

  // Tạo / thu hồi URL xem trước
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSending) onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setImageError("Ảnh không được vượt quá 10MB.");
      return;
    }
    setImageError("");
    setImageFile(file);
  };

  const handleTypeChange = (type) => {
    setTypeHint("");
    if (type === "SINGLE_CHOICE" && options.filter(o => o.correct).length > 1) {
      setOptions(prev => prev.map(o => ({ ...o, correct: false })));
      setTypeHint("Đã bỏ chọn các đáp án đúng. Vui lòng chọn lại đúng 1 đáp án.");
    }
    setQuestionType(type);
  };

  const updateOption = (idx, patch) => {
    setOptions(prev => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const toggleCorrect = (idx) => {
    setTypeHint("");
    setOptions(prev =>
      prev.map((o, i) => {
        if (questionType === "MULTIPLE_CHOICE") {
          return i === idx ? { ...o, correct: !o.correct } : o;
        }
        return { ...o, correct: i === idx };
      })
    );
  };

  const addOption = () => {
    const used = new Set(options.map(o => o.optionLabel.trim().toUpperCase()));
    const singles = options
      .map(o => o.optionLabel.trim().toUpperCase())
      .filter(l => /^[A-Z]$/.test(l))
      .map(l => l.charCodeAt(0));
    let code = singles.length ? Math.max(...singles) + 1 : 65;
    if (code > 90 || used.has(String.fromCharCode(code))) {
      code = 65;
      while (code <= 90 && used.has(String.fromCharCode(code))) code++;
    }
    const label = code <= 90 ? String.fromCharCode(code) : "";
    setOptions(prev => [...prev, { optionLabel: label, content: "", correct: false }]);
  };

  const deleteOption = (idx) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    setSubmitError("");

    const errs = validateQuestion({
      content,
      hasImage: !!imageFile,
      questionType,
      answerOption: options
    });
    setErrors(errs);
    if (errs.length > 0) return;

    const numTrim = String(questionNumber).trim();
    const payload = {
      questionNumber: numTrim === "" ? null : Number(numTrim),
      content: content.trim() || null,
      questionType,
      answerOption: options.map(o => ({
        optionLabel: o.optionLabel.trim(),
        content: o.content,
        correct: !!o.correct
      }))
    };

    setIsSending(true);
    try {
      const res = await questionService.createQuestion(examId, payload, imageFile);
      onCreated?.(res?.data ?? res);
    } catch (err) {
      setSubmitError(err?.message || "Không thể thêm câu hỏi.");
    } finally {
      setIsSending(false);
    }
  };

  const isMulti = questionType === "MULTIPLE_CHOICE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-lg shadow-xl border border-neutral-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-left"
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isSending}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-bold text-neutral-900 mb-4">Thêm câu hỏi</h3>

        {submitError && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs whitespace-pre-wrap">
            {submitError}
          </div>
        )}
        {errors.length > 0 && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs space-y-0.5">
            {errors.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {/* Số câu */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">Số câu (tùy chọn)</label>
            <input
              type="number"
              min="1"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
              placeholder="Để trống để tự động đánh số"
              className="w-40 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-900 text-neutral-900"
            />
          </div>

          {/* Ảnh */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">Ảnh (tùy chọn)</label>
            {previewUrl ? (
              <div className="border border-neutral-200 bg-neutral-50/50 p-2 rounded-lg relative">
                <img src={previewUrl} alt="Xem trước" className="w-full h-auto rounded-md object-contain max-h-60 mx-auto" />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="absolute top-3 right-3 p-1 bg-white border border-neutral-200 text-neutral-500 hover:text-red-600 rounded-md shadow-2xs cursor-pointer"
                  title="Xóa ảnh"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-neutral-300 hover:border-orange-300 hover:bg-orange-50/20 rounded-lg text-xs text-neutral-600 cursor-pointer transition-colors">
                <ImageIcon size={15} className="text-orange-500" />
                <span>Chọn ảnh (JPEG, PNG, WEBP, tối đa 10MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            {imageError && <p className="mt-1.5 text-xs text-red-600">{imageError}</p>}
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">Nội dung câu hỏi</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full h-24 p-3 border border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 bg-white rounded-lg resize-y focus:outline-none text-xs text-neutral-900"
            />
          </div>

          {/* Loại câu hỏi */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">Loại câu hỏi</label>
            <select
              value={questionType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-neutral-300 focus:border-neutral-900 text-neutral-900 rounded-md text-xs cursor-pointer focus:outline-none"
            >
              <option value="SINGLE_CHOICE">Một đáp án</option>
              <option value="MULTIPLE_CHOICE">Nhiều đáp án</option>
            </select>
            {typeHint && <p className="mt-1.5 text-xs text-orange-600">{typeHint}</p>}
          </div>

          {/* Đáp án */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1.5">Đáp án</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name="correct-option"
                    checked={!!opt.correct}
                    onChange={() => toggleCorrect(idx)}
                    title="Đáp án đúng"
                    className="shrink-0 cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="text"
                    value={opt.optionLabel}
                    onChange={(e) => updateOption(idx, { optionLabel: e.target.value })}
                    className="w-12 px-2 py-1.5 text-xs font-bold text-center border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-900 text-neutral-900"
                  />
                  <input
                    type="text"
                    value={opt.content}
                    onChange={(e) => updateOption(idx, { content: e.target.value })}
                    placeholder="Nội dung đáp án..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:border-neutral-900 text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => deleteOption(idx)}
                    disabled={options.length <= 2}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title="Xóa đáp án"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50/50 hover:border-orange-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm đáp án</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSending}
            className="px-4 py-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSending}
            className="px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSending ? "Đang lưu..." : "Thêm câu hỏi"}
          </button>
        </div>
      </form>
    </div>
  );
}
