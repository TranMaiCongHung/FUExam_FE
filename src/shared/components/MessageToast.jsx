import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function MessageToast({ type = 'success', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border transform transition-all duration-300 ${
      isSuccess 
        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-transparent text-white shadow-emerald-500/30' 
        : 'bg-gradient-to-r from-red-500 to-rose-600 border-transparent text-white shadow-red-500/30'
    }`}>
      {isSuccess ? (
        <CheckCircle className="text-white drop-shadow-sm" size={22} />
      ) : (
        <XCircle className="text-white drop-shadow-sm" size={22} />
      )}
      <div className="text-sm font-semibold pr-8 whitespace-pre-wrap max-w-md drop-shadow-sm leading-relaxed">
        {message}
      </div>
      <button 
        onClick={onClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-white/20 text-white"
      >
        <X size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
