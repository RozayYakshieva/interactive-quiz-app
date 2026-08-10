import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightElement,
  className = "",
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const handleTogglePassword = () => setShowPassword(!showPassword);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 ml-1">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={20} />
          </div>
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            outline-none transition-all duration-200 placeholder:text-gray-400
            ${Icon ? "pl-12" : ""} ${rightElement || isPassword ? "pr-12" : ""}`}
        />

        {(rightElement || isPassword) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            {isPassword ? (
              showPassword ? (
                <EyeOff size={20} onClick={handleTogglePassword} />
              ) : (
                <Eye size={20} onClick={handleTogglePassword} />
              )
            ) : (
              rightElement
            )}
          </div>
        )}
      </div>
    </div>
  );
}
