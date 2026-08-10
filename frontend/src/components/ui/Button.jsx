export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const baseStyles =
    "w-full px-6 py-3 rounded-2xl font-semibold transition-all duration-200 active:scale-95";

  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-xl",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    link: "bg-transparent text-blue-600 hover:underline shadow-none p-0",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed pointer-events-none";
  const finalClassName = `${baseStyles} ${variants[variant]} ${
    disabled ? disabledStyles : ""
  } ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
}
