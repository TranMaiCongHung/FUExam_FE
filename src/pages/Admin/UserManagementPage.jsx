import { Search, UserPlus, Eye, X } from "lucide-react";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import MessageToast from "@/shared/components/MessageToast";
import RecentActiveUsers from "./components/RecentActiveUsers";

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    role: "USER",
    status: "ACTIVE"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState({ type: 'success', message: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      fullName: "",
      username: "",
      password: "",
      email: "",
      role: "USER",
      status: "ACTIVE"
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      password: "", // Not updated in edit mode
      email: user.email || "",
      role: user.role || "USER",
      status: user.status || "ACTIVE"
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      setIsSubmitting(true);
      if (modalMode === "create") {
        await userService.createUser({
          fullName: formData.fullName,
          username: formData.username,
          password: formData.password,
          email: formData.email,
          role: formData.role,
          status: formData.status
        });
      } else {
        if (!selectedUser?.id) {
           setFormError("Thiếu ID người dùng.");
           setIsSubmitting(false);
           return;
        }
        // Only role and status are allowed to be updated according to spec
        await userService.updateUser(selectedUser.id, {
          role: formData.role,
          status: formData.status
        });
      }
      handleCloseModal();
      fetchUsers();
      setToast({ type: 'success', message: 'Lưu thông tin người dùng thành công!' });
    } catch (err) {
      console.error("Failed to save user:", err);
      const errorMsg = err.message || "Lưu thông tin người dùng thất bại.";
      setToast({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.fullName || user.name || user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <MessageToast 
        type={toast.type} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, message: '' })} 
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Quản lý Người dùng</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">Danh sách tất cả tài khoản ({users.length} người dùng) trong hệ thống.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs w-fit cursor-pointer"
        >
          <UserPlus size={16} strokeWidth={2.5} />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Thẻ theo dõi người dùng mới & hoạt động gần đây */}
      <RecentActiveUsers
        users={users}
        loading={loading}
        onSelectUser={openEditModal}
      />

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <h2 className="font-semibold text-neutral-900 text-sm">Danh sách tài khoản</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
            <input
              type="text"
              placeholder="Tìm theo họ tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-500 text-[11px] font-semibold tracking-wider uppercase border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3.5">NGƯỜI DÙNG</th>
                <th className="px-6 py-3.5">EMAIL</th>
                <th className="px-6 py-3.5">VAI TRÒ</th>
                <th className="px-6 py-3.5">TRẠNG THÁI</th>
                <th className="px-6 py-3.5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-neutral-400">
                    <div className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-2"></div>
                    <p>Đang tải danh sách người dùng...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-neutral-400">
                    Không tìm thấy người dùng phù hợp với từ khóa &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = user.fullName || user.name || user.username || "Chưa đặt tên";
                  const initials = displayName.substring(0, 2).toUpperCase();
                  const isActive = user.status === 'ACTIVE' || user.status === 'Active';
                  const isAdmin = user.role === 'ADMIN' || user.role === 'Admin';
                  return (
                    <tr key={user.id || user.username} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <span className="font-semibold text-neutral-900">{displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-neutral-600 text-xs sm:text-sm">{user.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          isAdmin 
                            ? "bg-orange-50 text-orange-700 border border-orange-200" 
                            : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                        }`}>
                          {user.role || (isAdmin ? "ADMIN" : "USER")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}>
                            {user.status || (isActive ? "ACTIVE" : "DISABLE")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-neutral-100 bg-neutral-50/50">
          <p className="text-xs text-neutral-400">
            Hiển thị {filteredUsers.length} trên tổng số {users.length} tài khoản
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {modalMode === "create" ? "Thêm người dùng mới" : "Chi tiết & Phân quyền"}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Họ và tên</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  readOnly={modalMode === "edit"}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className={`w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 transition-colors shadow-2xs ${
                    modalMode === "edit" 
                      ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" 
                      : "bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                  }`}
                  required={modalMode === "create"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tên đăng nhập</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  readOnly={modalMode === "edit"}
                  placeholder="Ví dụ: anv..."
                  className={`w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 transition-colors shadow-2xs ${
                    modalMode === "edit" 
                      ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" 
                      : "bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                  }`}
                  required={modalMode === "create"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={modalMode === "edit"}
                  placeholder="Ví dụ: anv@fpt.edu.vn..."
                  className={`w-full px-3.5 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 transition-colors shadow-2xs ${
                    modalMode === "edit" 
                      ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" 
                      : "bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                  }`}
                  required={modalMode === "create"}
                />
              </div>

              {modalMode === "create" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Mật khẩu</label>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
                    required={modalMode === "create"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Vai trò</label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Trạng thái</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors shadow-2xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLE">DISABLE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-6 border-t border-neutral-100">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? "Đang lưu..." : (modalMode === "create" ? "Tạo người dùng" : "Lưu thay đổi")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
