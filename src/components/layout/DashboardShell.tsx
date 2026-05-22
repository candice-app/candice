"use client";

import PresenceBottomNav from "@/components/presence/BottomNav";

interface DashboardShellProps {
  children: React.ReactNode;
  pendingCount?: number;
  noNav?: boolean;
}

export default function DashboardShell({ children, noNav = false }: DashboardShellProps) {
  return (
    <div className="dashboard-layout">
      <main id="main-content" className="main-content" role="main">
        {children}
      </main>
      {!noNav && <PresenceBottomNav />}
    </div>
  );
}
