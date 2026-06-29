import { useMemo, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const titles = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/departments": "Departments",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/attendance": "Attendance",
  "/leave-requests": "Leave Requests",
  "/support-tickets": "Support Tickets",
  "/notifications": "Notifications",
  "/analytics": "Analytics",
  "/employee-analytics": "Employee Lookup",
  "/payroll": "Payroll",
};

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const roleName = localStorage.getItem("roleName") || "User";
  const departmentName = localStorage.getItem("departmentName");
  const teamName = localStorage.getItem("teamName");
  const workspaceName = teamName || departmentName || "Company";

  const pageTitle = useMemo(() => {
    if (titles[location.pathname]) return titles[location.pathname];
    if (location.pathname.startsWith("/create-")) return "Create Record";
    if (location.pathname.startsWith("/edit-")) return "Edit Record";
    return "IT ERP";
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-shell">
        <header className="topbar">
          <button
            aria-label="Open navigation"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <FiMenu aria-hidden="true" />
          </button>

          <div>
            <span className="eyebrow">{workspaceName} Workspace</span>
            <h2>{pageTitle}</h2>
          </div>

          <div className="topbar-user">
            <strong>{roleName}</strong>
            <span>{teamName || departmentName || "All departments"}</span>
          </div>
        </header>

        <section className="content-shell">{children}</section>
      </main>
    </div>
  );
}

export default Layout;
