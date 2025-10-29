import { NavLink } from "react-router-dom";
import { Home, Users, Megaphone, CalendarDays, BarChart3, Upload, LogOut, Languages, Image } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/users", label: "User Management", icon: Users },
  { to: "/content", label: "Content Push", icon: Megaphone },
  { to: "/events", label: "Event Management", icon: CalendarDays },
  { to: "/media", label: "Media Gallery", icon: Image },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/uploads", label: "Upload Documents", icon: Upload }
];

export default function Sidebar() {
  const [language, setLanguage] = useState<"en" | "te">("en");
  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-orange-500 via-orange-400 to-green-600 text-white flex flex-col">
      <div className="px-5 py-6">
        <div className="font-semibold text-xl">Admin Panel</div>
        <div className="text-sm opacity-90">Telangana Congress</div>
      </div>
      <nav className="flex-1 px-3 space-y-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition 
               ${isActive ? "bg-white/20" : "hover:bg-white/15"}`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-base">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-2 pb-4 space-y-2">
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition"
          onClick={() => setLanguage(language === "en" ? "te" : "en")}
          aria-label="Change language"
          title="Change language"
        >
          <Languages className="w-5 h-5" />
          <span className="text-sm">{language === "en" ? "తెలుగు" : "English"}</span>
        </button>
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}