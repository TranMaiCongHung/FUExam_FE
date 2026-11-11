import { GraduationCap, ShieldCheck } from "lucide-react";
import GoogleLoginButton from "@/features/auth/components/GoogleLoginButton";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50/60 px-4 py-12 font-sans">
            <div className="relative w-full max-w-md">
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl px-8 py-10 flex flex-col gap-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-2xs">
                            <GraduationCap size={28} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                                FUExam
                            </h1>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                                FPT University Exam Hub
                            </p>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xs leading-relaxed">
                            Cổng ôn luyện đề thi trắc nghiệm và đánh giá năng lực dành cho sinh viên.
                        </p>
                    </div>

                    <div className="border-t border-neutral-100" />

                    <div className="flex flex-col gap-3 py-1">
                        <GoogleLoginButton />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 bg-neutral-50 py-2.5 px-3 rounded-lg border border-neutral-200">
                        <ShieldCheck size={16} className="text-orange-500 shrink-0" />
                        <span>Đăng nhập an toàn qua tài khoản Google</span>
                    </div>

                    <p className="text-center text-[11px] text-neutral-400 mt-1">
                        FUExam Portal · 2026
                    </p>
                </div>
            </div>
        </div>
    );
}

