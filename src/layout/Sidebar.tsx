import { NavLink } from "react-router-dom";
import { Home, Users, Megaphone, CalendarDays, BarChart3, Upload, LogOut, Languages, Image, X } from "lucide-react";
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [language, setLanguage] = useState<"en" | "te">("en");
  
  const handleNavClick = () => {
    // Close mobile menu when navigating
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 min-h-screen bg-gradient-to-b from-orange-500 via-orange-400 to-green-600 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/20">
          <div>
            <div className="font-semibold text-xl">Admin Panel</div>
            <div className="text-sm opacity-90">Telangana Congress</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block px-5 py-6">
          <div className="font-semibold text-xl">Admin Panel</div>
          <div className="text-sm opacity-90">Telangana Congress</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition 
                 ${isActive ? "bg-white/20" : "hover:bg-white/15"}`
              }
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="text-sm md:text-base">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto px-2 pb-4 space-y-2 border-t border-white/20 pt-4">
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
    </>
  );
}