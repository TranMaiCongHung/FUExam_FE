import { useState, useMemo } from "react";
import { Sparkles, Clock, CheckCircle2 } from "lucide-react";

export default function RecentActiveUsers({ users = [], loading = false, onSelectUser }) {
  const [filterType, setFilterType] = useState("recent"); // "recent" | "active"

  // 1. Mới đăng ký gần đây
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      })
      .slice(0, 6);
  }, [users]);

  // 2. Đang hoạt động (ACTIVE)
  const activeUsers = useMemo(() => {
    return [...users]
      .filter((u) => u.status === "ACTIVE" || u.status === "Active")
      .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
      .slice(0, 6);
  }, [users]);

  const displayList = filterType === "recent" ? recentUsers : activeUsers;
  const totalActive = users.filter((u) => u.status === "ACTIVE" || u.status === "Active").length;

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs">
      {/* Header tối giản */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-orange-500 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-neutral-900">
            {filterType === "recent" ? "Tài khoản mới đăng ký" : "Tài khoản đang hoạt động"}
          </h2>
          <span className="text-[11px] text-neutral-400 font-medium">
            ({displayList.length})
          </span>
        </div>

        {/* Tabs chuyển đổi gọn gàng */}
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs self-start sm:self-auto border border-neutral-200/60">
          <button
            type="button"
            onClick={() => setFilterType("recent")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filterType === "recent"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Clock size={12} />
            <span>Mới đăng ký</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("active")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filterType === "active"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Hoạt động ({totalActive})</span>
          </button>
        </div>
      </div>

      {/* Danh sách người dùng dạng thẻ phẳng tinh gọn */}
      {loading ? (
        <div className="py-5 text-center text-xs text-neutral-400">
          <div className="inline-block w-4 h-4 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-1.5"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-4 text-center text-xs text-neutral-400">
          Chưa có tài khoản nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {displayList.map((user) => {
            const displayName = user.fullName || user.name || user.username || "Chưa đặt tên";
            const initials = displayName.substring(0, 2).toUpperCase();
            const isActive = user.status === "ACTIVE" || user.status === "Active";
            const isAdmin = user.role === "ADMIN" || user.role === "Admin";

            return (
              <div
                key={user.id || user.username}
                onClick={() => onSelectUser && onSelectUser(user)}
                title="Nhấp để xem chi tiết"
                className="group flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/70 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer shadow-2xs bg-white"
              >
                {/* Avatar tròn nhỏ kèm chấm trạng thái */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
                    {initials}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      isActive ? "bg-emerald-500" : "bg-neutral-300"
                    }`}
                  />
                </div>

                {/* Thông tin rút gọn */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                      {displayName}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                        isAdmin
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "text-neutral-500 bg-neutral-100"
                      }`}
                    >
                      {isAdmin ? "Admin" : "Sinh viên"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {user.email || user.username}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
