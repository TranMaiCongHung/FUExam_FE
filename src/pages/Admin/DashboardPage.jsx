import { Users, UserCheck, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers(0, 100);
        const userList = response?.data?.content || response?.content || [];
        setUsers(userList);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "Active" || u.status === "ACTIVE").length;
  const adminUsers = users.filter(u => u.role === "Admin" || u.role === "ADMIN").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Tổng quan hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Tổng quan số liệu và hoạt động của hệ thống FUExam.
        </p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Tổng người dùng */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-500">
            <Users size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : totalUsers}
            </span>
            <span className="text-xs font-semibold text-neutral-700 mt-1.5">Tổng người dùng</span>
            <span className="text-[11px] text-neutral-400">Tài khoản đã đăng ký</span>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <UserCheck size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : activeUsers}
            </span>
            <span className="text-xs font-semibold text-neutral-700 mt-1.5">Đang hoạt động</span>
            <span className="text-[11px] text-neutral-400">Trạng thái Active</span>
          </div>
        </div>

        {/* Card 3: Quản trị viên */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4 shadow-2xs sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-800">
            <Shield size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : adminUsers}
            </span>
            <span className="text-xs font-semibold text-neutral-700 mt-1.5">Quản trị viên</span>
            <span className="text-[11px] text-neutral-400">Tài khoản Admin</span>
          </div>
        </div>
      </div>

      {/* Recent accounts mini-table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900">Tài khoản gần đây</h2>
          </div>
          <span className="text-xs text-neutral-400">3 tài khoản đăng ký mới nhất</span>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {loading ? (
            <div className="px-5 py-8 text-center text-xs text-neutral-400">
              Đang tải danh sách người dùng...
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-neutral-400">
              Chưa có dữ liệu người dùng.
            </div>
          ) : (
            users.slice(-3).reverse().map(u => {
              const isAdmin = u.role === "Admin" || u.role === "ADMIN";
              const isTeacher = u.role === "Teacher" || u.role === "TEACHER";
              const isActive = u.status === "Active" || u.status === "ACTIVE";

              return (
                <div key={u.id || u.username} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50/70 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                      {u.fullName || u.username || "Chưa đặt tên"}
                    </p>
                    <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {/* Badge Role */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isAdmin
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : isTeacher
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                    }`}>
                      {isAdmin ? "Quản trị viên" : isTeacher ? "Giảng viên" : "Sinh viên"}
                    </span>
                    
                    {/* Badge Status */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                    }`}>
                      {isActive ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

