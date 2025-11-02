import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";
  
  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/users") return "User Management";
    if (pathname === "/content") return "Content Push";
    if (pathname === "/events") return "Event Management";
    if (pathname === "/media") return "Media Gallery";
    if (pathname === "/analytics") return "Analytics";
    if (pathname === "/uploads") return "Upload Documents";
    return "Admin Panel";
  };

  return (
    <header className="h-14 border-b bg-white sticky top-0 z-30 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          
          {/* Page Title */}
          <div>
            <div className="text-lg md:text-xl font-semibold">{getPageTitle()}</div>
            {isDashboard && (
              <div className="hidden md:block text-xs text-gray-500">
                Overview of key metrics and activities
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}