export default function Avatar({ name, size = 36 }) {
  const initial = name ? name.charAt(0).toUpperCase() : "A";
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0"
    >
      {initial}
    </div>
  );
}

