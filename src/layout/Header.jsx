import { Menu, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../shared/components/Avatar";
import SettingsDropdown from "../shared/components/SettingsDropdown";

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Quản trị viên";

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white/95 border-b border-neutral-200/80 sticky top-0 z-20 backdrop-blur-md shadow-2xs">
      {/* Phía bên trái Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
        
        <Avatar name={username} size={34} />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-neutral-400 font-medium">Quản trị hệ thống</span>
          <span className="text-xs sm:text-sm font-bold text-neutral-800 truncate max-w-[160px] mt-0.5">{username}</span>
        </div>
      </div>

      {/* Phía bên phải Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate("/")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200 transition-colors cursor-pointer"
          title="Chuyển sang trang Sinh viên"
        >
          <GraduationCap size={14} className="text-orange-600" />
          <span>Trang sinh viên</span>
        </button>

        <SettingsDropdown />
      </div>
    </header>
  );
}

