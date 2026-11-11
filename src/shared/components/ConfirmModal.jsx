import { AlertTriangle, CheckCircle, Info, HelpCircle, XCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Xác nhận",
  message,
  type = "question", // "question" | "danger" | "warning" | "success" | "info"
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  hideCancel = false,
  confirmButtonClass = "",
  children
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return (
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <XCircle size={26} strokeWidth={2.2} />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>
        );
      case "success":
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle size={26} strokeWidth={2.2} />
          </div>
        );
      case "info":
        return (
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Info size={26} strokeWidth={2.2} />
          </div>
        );
      case "question":
      default:
        return (
          <div className="w-10 h-10 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <HelpCircle size={22} strokeWidth={2.2} />
          </div>
        );
    }
  };

  const getDefaultConfirmClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      default:
        return "bg-orange-500 hover:bg-orange-600 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full p-6 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-neutral-900 leading-tight">
              {title}
            </h3>
            {message && (
              <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Optional Custom Content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium text-xs sm:text-sm shadow-2xs transition-all cursor-pointer ${getDefaultConfirmClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
