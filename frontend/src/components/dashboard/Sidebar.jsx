import { NavLink } from "react-router-dom";
import { LayoutDashboard, History, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "History", icon: History, to: "/history" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-blue-600 tracking-tight">
          QuizMaster
        </span>
        <p className="text-xs text-gray-400 mt-0.5">Organizer Portal</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
