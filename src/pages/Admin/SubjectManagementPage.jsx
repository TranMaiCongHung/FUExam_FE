import { Book, Plus, Edit, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { subjectService } from "@/services/subjectService";
import MessageToast from "@/shared/components/MessageToast";
import ConfirmModal from "@/shared/components/ConfirmModal";

const SEMESTERS = [
  { name: "Kỳ 1", value: 1 }, { name: "Kỳ 2", value: 2 }, { name: "Kỳ 3", value: 3 },
  { name: "Kỳ 4", value: 4 }, { name: "Kỳ 5", value: 5 }, { name: "Kỳ 6", value: 6 },
  { name: "Kỳ 7", value: 7 }, { name: "Kỳ 8", value: 8 }, { name: "Kỳ 9", value: 9 }
];

export default function SubjectManagementPage() {
  const [activeSemester, setActiveSemester] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal Popup xác nhận thay thế window.confirm
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "question",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    confirmButtonClass: "",
    onConfirm: () => {}
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    subjectCode: "",
    subjectName: "",
    termNumber: 1,
    status: "ENABLE"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState({ type: 'success', message: '' });

  useEffect(() => {
    fetchSubjects(activeSemester);
  }, [activeSemester]);

  const fetchSubjects = async (termNumber) => {
    try {
      setLoading(true);
      const res = await subjectService.getSubjectsByTerm(termNumber);
      const data = res?.data || res || [];
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      subjectCode: "",
      subjectName: "",
      termNumber: activeSemester,
      status: "ENABLE"
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setModalMode("edit");
    setSelectedSubject(subject);
    setFormData({
      subjectCode: subject.subjectCode || "",
      subjectName: subject.subjectName || "",
      termNumber: subject.termNumber || activeSemester,
      status: subject.status || "ENABLE"
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'termNumber' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.subjectCode || !formData.subjectName || !formData.termNumber) {
      setFormError("Vui lòng nhập đầy đủ Mã môn học, Tên môn học và Học kỳ.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === "create") {
        await subjectService.createSubject(formData);
      } else {
        const targetId = selectedSubject?.id || selectedSubject?.subjectId;
        if (!targetId) {
           setFormError("Không tìm thấy ID môn học từ máy chủ.");
           setIsSubmitting(false);
           return;
        }
        await subjectService.updateSubject(targetId, formData);
      }
      handleCloseModal();
      fetchSubjects(activeSemester);
      setToast({ type: 'success', message: 'Lưu môn học thành công!' });
    } catch (err) {
      console.error("Failed to save subject:", err);
      const errorMsg = err.message || "Lỗi khi lưu môn học.";
      setToast({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (sub) => {
    const targetId = sub?.id || sub?.subjectId;
    if (!targetId) {
      setToast({ type: 'error', message: "Subject ID is missing from backend data: " + JSON.stringify(sub) });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: "Xác nhận xóa môn học",
      message: `Bạn có chắc chắn muốn xóa môn học "${sub.subjectCode} - ${sub.subjectName}" khỏi hệ thống không?`,
      type: "danger",
      confirmText: "Xóa môn học",
      cancelText: "Hủy",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await subjectService.deleteSubject(targetId);
          fetchSubjects(activeSemester); // Refresh list
          setToast({ type: 'success', message: 'Đã xóa môn học thành công!' });
        } catch (err) {
          console.error("Failed to delete subject:", err);
          const errorMsg = err.message || "Xóa môn học thất bại.";
          setToast({ type: 'error', message: errorMsg });
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <MessageToast 
        type={toast.type} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, message: '' })} 
      />

      {/* Modal Popup xác nhận thay thế window.confirm */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        confirmButtonClass={modalConfig.confirmButtonClass}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Quản lý Môn học</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">Quản lý chương trình môn học theo từng học kỳ đào tạo.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs w-fit cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Thêm môn học</span>
        </button>
      </div>

      {/* Curriculum Semester Selector */}
      <div className="border border-neutral-200 rounded-lg p-3.5 sm:p-4 bg-white shadow-2xs space-y-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0 min-w-[76px] whitespace-nowrap">
            Học kỳ
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SEMESTERS.map(sem => {
              const isActive = activeSemester === sem.value;
              return (
                <button 
                  key={sem.value} 
                  onClick={() => setActiveSemester(sem.value)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xs" 
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {sem.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Book className="text-neutral-600" size={18} />
            <h2 className="font-semibold text-neutral-900 text-sm">
              Môn học trong {SEMESTERS.find(s => s.value === activeSemester)?.name}
            </h2>
          </div>
          <span className="bg-neutral-100 text-neutral-600 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-neutral-200">
            {subjects.length} môn
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-500 text-[11px] font-semibold tracking-wider uppercase border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3.5">MÃ MÔN HỌC</th>
                <th className="px-6 py-3.5">TÊN MÔN HỌC</th>
                <th className="px-6 py-3.5">TRẠNG THÁI</th>
                <th className="px-6 py-3.5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-900">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-neutral-400">
                    <div className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin mb-2"></div>
                    <p>Đang tải danh sách môn học...</p>
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-neutral-400">
                    Chưa có môn học nào trong học kỳ này.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => {
                  const isActive = sub.status === 'ENABLE' || sub.status === 'Enable';
                  const subId = sub.id || sub.subjectId; 
                  return (
                    <tr key={subId || sub.subjectCode} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-neutral-900">{sub.subjectCode}</td>
                      <td className="px-6 py-3.5 text-neutral-700">{sub.subjectName}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}>
                            {sub.status || (isActive ? "ENABLE" : "DISABLE")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer" 
                            title="Chỉnh sửa môn học"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer" 
                            title="Xóa môn học"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa môn học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">
                {modalMode === "create" ? "Thêm môn học mới" : "Chỉnh sửa môn học"}
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
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Mã môn học</label>
                <input 
                  type="text" 
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: DBI202, PRN211..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Tên môn học</label>
                <input 
                  type="text" 
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Introduction to Databases..."
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Học kỳ</label>
                <select 
                  name="termNumber"
                  value={formData.termNumber}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 transition-colors shadow-2xs"
                >
                  {SEMESTERS.map(sem => (
                    <option key={sem.value} value={sem.value}>{sem.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Trạng thái</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-sm text-neutral-900 transition-colors shadow-2xs"
                >
                  <option value="ENABLE">ENABLE</option>
                  <option value="DISABLE">DISABLE</option>
                </select>
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
                  {isSubmitting ? "Đang lưu..." : (modalMode === "create" ? "Tạo môn học" : "Cập nhật")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
