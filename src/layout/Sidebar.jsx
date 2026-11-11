import { LayoutDashboard, Users, BookOpen, BookMarked, X, GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";

// Danh sách các menu item của Sidebar
const NAV_ITEMS = [
  { label: "Tổng quan",          icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Quản lý người dùng", icon: Users,            to: "/admin/users"     },
  { label: "Quản lý môn học",    icon: BookOpen,         to: "/admin/subjects"  },
  { label: "Quản lý đề thi",     icon: BookMarked,       to: "/admin/exams"     },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 flex flex-col
          bg-white border-r border-neutral-200/80
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand: Logo & Title đồng nhất với Student Portal */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-200/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-2xs border border-orange-100">
              <GraduationCap size={18} strokeWidth={2.2} />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-lg text-neutral-900 tracking-tight">FUExam</span>
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wide">
                Admin
              </span>
            </div>
          </div>
          {/* Nút tắt Sidebar (chỉ hiện trên Mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-bold text-neutral-400 tracking-wider uppercase select-none">
            Menu Quản trị
          </p>
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-lg
                text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer
                ${isActive
                  ? "bg-orange-500 text-white font-semibold shadow-xs hover:bg-orange-600"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }
              `}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <p className="text-[11px] text-neutral-400 text-center select-none">
            © 2026 FUExam System
          </p>
        </div>
      </aside>
    </>
  );
}

