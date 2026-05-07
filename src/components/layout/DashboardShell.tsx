import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <BottomNav />
      <main id="main-content" className="main-content" role="main">
        {children}
      </main>
    </div>
  );
}
