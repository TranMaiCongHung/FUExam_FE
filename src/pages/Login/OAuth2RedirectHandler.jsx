import { useOAuth2Redirect } from "@/features/auth/hooks/useOAuth2Redirect";

export default function OAuth2RedirectHandler() {
    useOAuth2Redirect();

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50/60 font-sans">
            <div className="text-center p-8 bg-white border border-neutral-200 rounded-2xl shadow-xl max-w-sm w-full mx-4">
                <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-neutral-900 font-bold text-sm">Đang xử lý đăng nhập Google...</h2>
                <p className="text-neutral-400 text-xs mt-1">Hệ thống đang xác thực tài khoản của bạn.</p>
            </div>
        </div>
    );
}

