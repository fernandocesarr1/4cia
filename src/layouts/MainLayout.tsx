import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/sigo/Header";
import { Sidebar } from "@/components/sigo/Sidebar";

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
