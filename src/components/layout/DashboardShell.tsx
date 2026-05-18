"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

interface DashboardShellProps {
  children: React.ReactNode;
  pendingCount?: number;
}

export default function DashboardShell({ children, pendingCount }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div
        className={`sidebar-overlay${sidebarOpen ? " sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <BottomNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} pendingCount={pendingCount} />
      <main id="main-content" className="main-content" role="main">
        {children}
      </main>
    </div>
  );
}
