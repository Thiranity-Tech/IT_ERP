import { NavLink } from "react-router-dom";
import {
  FiActivity,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiGrid,
  FiLayers,
  FiLifeBuoy,
  FiLogOut,
  FiPieChart,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { ROLES } from "../constants/roles";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: FiGrid },
      { to: "/analytics", label: "Analytics", icon: FiPieChart, minRole: ROLES.MANAGER },
      { to: "/employee-analytics", label: "Employee Lookup", icon: FiPieChart, minRole: ROLES.MANAGER },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/projects", label: "Projects", icon: FiBriefcase },
      { to: "/tasks", label: "Tasks", icon: FiActivity },
      { to: "/attendance", label: "Attendance", icon: FiCalendar },
      { to: "/attendance-settings", label: "Attendance Timing", icon: FiSettings, minRole: ROLES.ADMIN, maxRole: ROLES.ADMIN },
      { to: "/leave-requests", label: "Leave Requests", icon: FiLayers },
      { to: "/payroll", label: "Payroll", icon: FiCreditCard },
      { to: "/notifications", label: "Notifications", icon: FiBell },
      { to: "/support-tickets", label: "Support Tickets", icon: FiLifeBuoy },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: FiUsers, minRole: ROLES.MANAGER },
      { to: "/departments", label: "Departments", icon: FiLayers, minRole: ROLES.ADMIN },
      { to: "/teams", label: "Teams", icon: FiLayers, minRole: ROLES.MANAGER },
    ],
  },
];

function Sidebar({ open, onClose }) {
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const roleName = localStorage.getItem("roleName") || "User";
  const userName = localStorage.getItem("userName") || roleName;
  const departmentName = localStorage.getItem("departmentName");
  const teamName = localStorage.getItem("teamName");
  const workspaceName =
    roleId >= ROLES.ADMIN
      ? "Company workspace"
      : teamName
        ? `${teamName} team`
        : departmentName
          ? `${departmentName} department`
          : "Personal workspace";

  const canSee = (item) =>
    (!item.minRole || roleId >= item.minRole) &&
    (!item.maxRole || roleId <= item.maxRole);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">IE</div>
          <div>
            <strong>IT ERP</strong>
            <span>Operations Suite</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <span>Signed in as</span>
          <strong>{userName}</strong>
          <small>{roleName}</small>
          <div className="workspace-chip">{workspaceName}</div>
        </div>

        <nav className="nav">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(canSee);
            if (!visibleItems.length) return null;

            return (
              <div className="nav-group" key={group.label}>
                <p>{group.label}</p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                      key={item.to}
                      onClick={onClose}
                      to={item.to}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button className="logout-button" onClick={logout} type="button">
          <FiLogOut aria-hidden="true" />
          Logout
        </button>
      </aside>

      {open && <button className="sidebar-backdrop" onClick={onClose} type="button" />}
    </>
  );
}

export default Sidebar;
