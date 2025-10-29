import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  console.log('AppLayout rendering');
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-50">
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}