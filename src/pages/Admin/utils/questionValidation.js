// Trả về mảng thông báo lỗi (rỗng = hợp lệ)
export function validateQuestion({ content, hasImage, questionType, answerOption }) {
  const errors = [];
  const options = Array.isArray(answerOption) ? answerOption : [];

  if (!(content && String(content).trim()) && !hasImage) {
    errors.push("Cần có nội dung hoặc hình ảnh cho câu hỏi");
  }

  if (options.length < 2) {
    errors.push("Cần có ít nhất 2 đáp án");
  }

  const labels = options.map(o => String(o.optionLabel ?? "").trim());
  if (labels.some(l => !l)) {
    errors.push("Nhãn đáp án không được để trống");
  }
  const nonEmpty = labels.filter(Boolean).map(l => l.toLowerCase());
  if (new Set(nonEmpty).size !== nonEmpty.length) {
    errors.push("Nhãn đáp án không được trùng nhau");
  }

  const correctCount = options.filter(o => o.correct === true || o.isCorrect === true).length;
  if (questionType === "MULTIPLE_CHOICE") {
    if (correctCount < 1) errors.push("Cần chọn ít nhất 1 đáp án đúng");
  } else if (correctCount !== 1) {
    errors.push("Câu hỏi một đáp án phải có đúng 1 đáp án đúng");
  }

  return errors;
}
