import {
  Users,
  UserCheck,
  Shield,
  Clock,
  BookOpen,
  FileText,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { subjectService } from "@/services/subjectService";
import { examService } from "@/services/examService";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [totalExamsCount, setTotalExamsCount] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [subjectsByTerm, setSubjectsByTerm] = useState({});
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Users
        const userPromise = userService.getUsers(0, 100).catch((err) => {
          console.error("Failed to fetch users:", err);
          return null;
        });

        // 2. Fetch Exams
        const examPromise = examService.getExams(0, 100).catch((err) => {
          console.error("Failed to fetch exams:", err);
          return null;
        });

        // 3. Fetch Subjects across 9 terms
        const subjectPromises = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((term) =>
          subjectService.getSubjectsByTerm(term).catch(() => [])
        );

        const [userRes, examRes, ...termResults] = await Promise.all([
          userPromise,
          examPromise,
          ...subjectPromises,
        ]);

        // Process Users
        const userList =
          userRes?.data?.content || userRes?.content || (Array.isArray(userRes) ? userRes : []);
        setUsers(userList);

        // Process Exams
        const examData = examRes?.data || examRes;
        const examList = examData?.content || (Array.isArray(examData) ? examData : []);
        setExams(examList);
        setTotalExamsCount(examData?.totalElements ?? examList.length);

        // Process Subjects
        const allSubjects = [];
        const seenCodes = new Set();
        const termDistribution = {};

        termResults.forEach((res, index) => {
          const term = index + 1;
          const list = res?.data || (Array.isArray(res) ? res : []);
          termDistribution[term] = list.length;
          list.forEach((sub) => {
            const key = sub.subjectCode || sub.id;
            if (key && !seenCodes.has(key)) {
              seenCodes.add(key);
              allSubjects.push({ ...sub, termNumber: term });
            }
          });
        });
        setSubjects(allSubjects);
        setSubjectsByTerm(termDistribution);

        // 4. Calculate total attempts from localStorage
        let attemptCount = 0;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("FUEXAM_ATTEMPT_HISTORY_")) {
              const arr = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(arr)) attemptCount += arr.length;
            }
          }
        } catch (_) {}
        setTotalAttempts(attemptCount);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, []);

  // Tính toán số liệu thống kê
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active" || u.status === "ACTIVE").length;
  const adminUsers = users.filter((u) => u.role === "Admin" || u.role === "ADMIN").length;

  const totalSubjects = subjects.length;
  const totalExams = totalExamsCount || exams.length;
  const feExams = exams.filter((e) => e.examType === "FE").length;
  const peExams = exams.filter((e) => e.examType === "PE").length;
  const publishedExams = exams.filter((e) => e.status !== "HIDDEN").length;
  const hiddenExams = exams.filter((e) => e.status === "HIDDEN").length;

  const fePercent = totalExams > 0 ? Math.round((feExams / totalExams) * 100) : 0;
  const publishedPercent = totalExams > 0 ? Math.round((publishedExams / totalExams) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Tổng quan hệ thống</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              Live
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Thống kê hoạt động của hệ thống FUExam.
          </p>
        </div>
      </div>

      {/* Row 1: 4 Thẻ chỉ số tổng quan chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng người dùng */}
        <div
          onClick={() => navigate("/admin/users")}
          className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-500 group-hover:scale-105 transition-transform">
            <Users size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : totalUsers}
            </span>
            <span className="text-xs font-semibold text-neutral-600 mt-1.5 truncate">
              Tổng người dùng
            </span>
          </div>
        </div>

        {/* Card 2: Số môn học */}
        <div
          onClick={() => navigate("/admin/subjects")}
          className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-105 transition-transform">
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : totalSubjects}
            </span>
            <span className="text-xs font-semibold text-neutral-600 mt-1.5 truncate">
              Tổng số môn học
            </span>
          </div>
        </div>

        {/* Card 3: Kho đề thi */}
        <div
          onClick={() => navigate("/admin/exams")}
          className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600 group-hover:scale-105 transition-transform">
            <FileText size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : totalExams}
            </span>
            <span className="text-xs font-semibold text-neutral-600 mt-1.5 truncate">
              Tổng số đề thi
            </span>
          </div>
        </div>

        {/* Card 4: Tổng lượt làm bài */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <Award size={22} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-extrabold text-neutral-900 leading-none">
              {loading ? "..." : totalAttempts}
            </span>
            <span className="text-xs font-semibold text-neutral-600 mt-1.5 truncate">
              Lượt luyện thi
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Thống kê chi tiết chuyên sâu (2 Cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Phân loại & Trạng thái đề thi */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold text-neutral-900">Phân loại & Trạng thái đề thi</h2>
            </div>
            <button
              onClick={() => navigate("/admin/exams")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Quản lý đề</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Box FE vs PE */}
            <div className="p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">Loại đề thi</span>
                <span className="text-[11px] text-neutral-500 font-bold">{fePercent}% FE</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden flex">
                <div style={{ width: `${fePercent}%` }} className="h-full bg-blue-500"></div>
                <div style={{ width: `${100 - fePercent}%` }} className="h-full bg-purple-500"></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  FE: {feExams}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                  PE: {peExams}
                </span>
              </div>
            </div>

            {/* Box Hiển thị vs Ẩn */}
            <div className="p-3.5 rounded-lg bg-neutral-50/70 border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">Hiển thị cho sinh viên</span>
                <span className="text-[11px] text-emerald-600 font-bold">{publishedPercent}% Mở</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden flex">
                <div style={{ width: `${publishedPercent}%` }} className="h-full bg-emerald-500"></div>
                <div style={{ width: `${100 - publishedPercent}%` }} className="h-full bg-neutral-400"></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Eye size={11} />
                  Hiện: {publishedExams}
                </span>
                <span className="flex items-center gap-1 text-neutral-600">
                  <EyeOff size={11} />
                  Ẩn: {hiddenExams}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-neutral-500 bg-orange-50/40 p-2.5 rounded-lg border border-orange-100">
            <span className="flex items-center gap-1.5 font-medium text-neutral-700">
              <Sparkles size={14} className="text-orange-500" />
              Tổng cộng có {totalExams} đề thi trên hệ thống
            </span>
            <span className="font-semibold text-orange-600">
              {publishedExams} đề sẵn sàng thi
            </span>
          </div>
        </div>

        {/* Phân bố môn học qua các kỳ */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold text-neutral-900">Phân bố môn học qua các kỳ</h2>
            </div>
            <button
              onClick={() => navigate("/admin/subjects")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((term) => {
              const count = subjectsByTerm[term] || 0;
              return (
                <div
                  key={term}
                  className="p-2.5 rounded-lg border border-neutral-200/70 bg-neutral-50/50 hover:bg-orange-50/30 hover:border-orange-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-neutral-700">Kỳ {term}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-orange-600 border border-neutral-200/80 shadow-2xs">
                    {count} môn
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-400 text-center pt-1">
            Tổng cộng: {totalSubjects} môn học đã được khởi tạo trong chương trình đào tạo
          </p>
        </div>
      </div>

      {/* Row 3: 2 Bảng danh sách tóm tắt (Recent Exams & Recent Accounts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bảng 1: Đề thi cập nhật gần đây */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-neutral-500" />
              <h2 className="text-sm font-bold text-neutral-900">Đề thi gần đây</h2>
            </div>
            <button
              onClick={() => navigate("/admin/exams")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {loading ? (
              <div className="px-5 py-6 text-center text-xs text-neutral-400">
                Đang tải dữ liệu đề thi...
              </div>
            ) : exams.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-neutral-400">
                Chưa có đề thi nào trong hệ thống.
              </div>
            ) : (
              exams.slice(-4).reverse().map((exam) => {
                const examId = exam.id ?? exam.examId;
                const isHidden = exam.status === "HIDDEN";
                return (
                  <div
                    key={examId || Math.random()}
                    onClick={() => navigate(`/admin/exams/${examId}`, { state: { exam } })}
                    className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                        {exam.title || "Untitled Exam"}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {exam.semesterCode || "N/A"} • {exam.description || "Không có mô tả"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {exam.examType && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            exam.examType === "PE"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {exam.examType}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isHidden
                            ? "bg-neutral-100 text-neutral-500 border border-neutral-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                        {isHidden ? "Ẩn" : "Hiện"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bảng 2: Tài khoản đăng ký gần đây */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-neutral-500" />
              <h2 className="text-sm font-bold text-neutral-900">Tài khoản gần đây</h2>
            </div>
            <button
              onClick={() => navigate("/admin/users")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {loading ? (
              <div className="px-5 py-6 text-center text-xs text-neutral-400">
                Đang tải danh sách người dùng...
              </div>
            ) : users.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-neutral-400">
                Chưa có dữ liệu người dùng.
              </div>
            ) : (
              users.slice(-4).reverse().map((u) => {
                const isAdmin = u.role === "Admin" || u.role === "ADMIN";
                const isTeacher = u.role === "Teacher" || u.role === "TEACHER";
                const isActive = u.status === "Active" || u.status === "ACTIVE";

                return (
                  <div
                    key={u.id || u.username}
                    onClick={() => navigate("/admin/users")}
                    className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-orange-600 transition-colors">
                        {u.fullName || u.username || "Chưa đặt tên"}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isAdmin
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : isTeacher
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                        }`}
                      >
                        {isAdmin ? "Admin" : isTeacher ? "Giảng viên" : "Sinh viên"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}
                      >
                        {isActive ? "Active" : "Khóa"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
