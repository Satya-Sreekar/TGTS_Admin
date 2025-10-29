import { useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";
  return (
    <header className="h-14 border-b bg-white">
      <div className="h-full px-4 flex items-center justify-between">
        {isDashboard ? (
          <div>
            <div className="text-xl font-semibold">Dashboard</div>
            <div className="text-xs text-gray-500">Overview of key metrics and activities</div>
          </div>
        ) : null}
        {/* right-side actions removed */}
      </div>
    </header>
  );
}