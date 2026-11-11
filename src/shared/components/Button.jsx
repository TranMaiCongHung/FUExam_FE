export default function Button({
    children,
    variant = "primary",
    type = "button",
    className = "",
    ...props
}) {
    const base =
        "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants = {
        primary:
            "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] shadow-xs px-4 py-2 text-sm",
        dark:
            "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] shadow-xs px-4 py-2 text-sm",
        ghost:
            "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 px-3 py-2 text-sm",
        outline:
            "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 px-4 py-2 text-sm shadow-2xs",
    };

    return (
        <button type={type} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
            {children}
        </button>
    );
}

