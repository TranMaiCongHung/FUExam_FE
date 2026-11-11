import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
    label,
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    error,
    ...props
}) {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword ? (show ? "text" : "password") : type;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-semibold text-neutral-700 tracking-wide"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={id}
                    type={resolvedType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="
            w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-lg
            px-3.5 py-2 text-sm text-neutral-900 placeholder-neutral-400
            focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400
            transition-colors shadow-2xs
          "
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                        aria-label={show ? "Hide password" : "Show password"}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        </div>
    );
}

