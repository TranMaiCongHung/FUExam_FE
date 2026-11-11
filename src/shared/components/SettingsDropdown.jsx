import { LogOut, Settings, GraduationCap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
        aria-label="Cài đặt tài khoản"
      >
        <Settings size={19} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-neutral-200 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <GraduationCap size={15} className="text-orange-500" />
            <span>Xem trang sinh viên</span>
          </button>

          <div className="border-t border-neutral-100 my-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}

