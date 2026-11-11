import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-white text-neutral-900 font-sans">
      {/* Cột bên trái: Menu điều hướng */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Cột bên phải: Nội dung chính bao gồm Header và phần hiển thị trang */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-neutral-50/40">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

