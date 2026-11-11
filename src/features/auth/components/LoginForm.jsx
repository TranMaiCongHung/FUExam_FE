import InputField from "@/shared/components/InputField";
import Button from "@/shared/components/Button";
import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginForm() {
    const { form, loading, error, handleChange, handleSubmit } = useLoginForm();

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Hiển thị lỗi từ BE nếu có */}
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center mb-2">
                    {error}
                </p>
            )}

            <InputField
                label="Email or Username"
                id="identifier"
                type="text"
                placeholder="admin@fuexam.edu"
                value={form.identifier}
                onChange={handleChange("identifier")}
            />

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 tracking-wide" htmlFor="password">
                        Mật khẩu
                    </label>
                    <button type="button" className="text-xs text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer transition-colors">
                        Quên mật khẩu?
                    </button>
                </div>
                <InputField
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange("password")}
                />
            </div>

            {/* Nút Submit tự động disabled khi đang gọi API */}
            <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
            </Button>
        </form>
    );
}
