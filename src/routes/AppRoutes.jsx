import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/Login/LoginPage";
import OAuth2RedirectHandler from "@/pages/Login/OAuth2RedirectHandler";
import AdminLayout from "@/layout/AdminLayout";
import DashboardPage from "@/pages/Admin/DashboardPage";
import UserManagementPage from "@/pages/Admin/UserManagementPage";
import ExamManagementPage from "@/pages/Admin/ExamManagementPage";
import ExamDetailsPage from "@/pages/Admin/ExamDetailsPage";
import SubjectManagementPage from "@/pages/Admin/SubjectManagementPage";
import ExamPracticePage from "@/pages/ExamPracticePage";
import StudentHomePage from "@/pages/Student/StudentHomePage";
import ProtectedRoute from "./ProtectedRoute";

export function AppRoutes() {
    return (
        <Routes>
            {/* Khi người dùng vào /login, sẽ hiện trang LoginPage */}
            <Route path="/login" element={<LoginPage />} />

            {/* Các route xử lý đăng nhập Google (OAuth2) */}
            <Route path="/oauth2/success" element={<OAuth2RedirectHandler />} />
            <Route path="/oauth2/error" element={<OAuth2RedirectHandler />} />

            {/* Admin Routes - Yêu cầu đăng nhập và có Role ADMIN */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="exams" element={<ExamManagementPage />} />
                    <Route path="exams/:id" element={<ExamDetailsPage />} />
                    <Route path="subjects" element={<SubjectManagementPage />} />
                    {/* Fallback cho /admin -> /admin/dashboard */}
                    <Route path="" element={<Navigate to="dashboard" replace />} />
                </Route>
            </Route>

            {/* User & Student Routes - Yêu cầu đăng nhập khi làm bài */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
                {/* Luyện thi & Thi thử (Hỗ trợ 2 mode: mode=study và mode=exam) */}
                <Route path="/exams/:id/practice" element={<ExamPracticePage />} />
            </Route>

            {/* Trang chủ cho sinh viên (Xem danh sách đề thi theo kỳ, môn - Cho phép xem công khai) */}
            <Route path="/" element={<StudentHomePage />} />

            {/* Nếu vào link linh tinh không tìm thấy, tự động văng về / */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
