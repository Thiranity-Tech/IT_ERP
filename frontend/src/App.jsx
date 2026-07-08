import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./constants/roles";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import Teams from "./pages/Teams";
import CreateTeam from "./pages/CreateTeam";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Attendance from "./pages/Attendance";
import AttendanceSettings from "./pages/AttendanceSettings";
import LeaveRequests from "./pages/LeaveRequests";
import SupportTickets from "./pages/SupportTickets";
import SupportTicketDetails from "./pages/SupportTicketDetails";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import EmployeeAnalytics from "./pages/EmployeeAnalytics";
import Payroll from "./pages/Payroll";
import CreateUser from "./pages/CreateUser";
import EditUser from "./pages/EditUser";
import CreateDepartment from "./pages/CreateDepartment";
import EditDepartment from "./pages/EditDepartment";
import CreateProject from "./pages/CreateProject";
import EditProject from "./pages/EditProject";
import CreateTask from "./pages/CreateTask";
import EditTask from "./pages/EditTask";
import CreateAttendance from "./pages/CreateAttendance";
import EditAttendance from "./pages/EditAttendance";
import CreateLeaveRequest from "./pages/CreateLeaveRequest";
import EditLeaveRequest from "./pages/EditLeaveRequest";
import ChangePassword from "./pages/ChangePassword";

function App() {
  const protectedPage = (page, minRole = ROLES.USER) => (
    <ProtectedRoute minRole={minRole}>{page}</ProtectedRoute>
  );

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/users" element={protectedPage(<Users />, ROLES.MANAGER)} />
        <Route path="/employee-analytics" element={protectedPage(<EmployeeAnalytics />, ROLES.MANAGER)} />
        <Route path="/departments" element={protectedPage(<Departments />, ROLES.ADMIN)} />
        <Route path="/teams" element={protectedPage(<Teams />, ROLES.MANAGER)} />
        <Route path="/create-team" element={protectedPage(<CreateTeam />, ROLES.MANAGER)} />
        <Route path="/projects" element={protectedPage(<Projects />)} />
        <Route path="/tasks" element={protectedPage(<Tasks />)} />
        <Route path="/attendance" element={protectedPage(<Attendance />)} />
        <Route path="/attendance-settings" element={protectedPage(<AttendanceSettings />, ROLES.ADMIN)} />
        <Route path="/leave-requests" element={protectedPage(<LeaveRequests />)} />
        <Route path="/support-tickets" element={protectedPage(<SupportTickets />)} />
        <Route path="/support-tickets/:id" element={protectedPage(<SupportTicketDetails />)} />
        <Route path="/notifications" element={protectedPage(<Notifications />)} />
        <Route path="/payroll" element={protectedPage(<Payroll />)} />
        <Route path="/analytics" element={protectedPage(<Analytics />, ROLES.MANAGER)} />
        <Route path="/create-user" element={protectedPage(<CreateUser />, ROLES.SUPER_ADMIN)} />
        <Route path="/edit-user/:id" element={protectedPage(<EditUser />, ROLES.SUPER_ADMIN)} />
        <Route path="/create-department" element={protectedPage(<CreateDepartment />, ROLES.SUPER_ADMIN)} />
        <Route path="/edit-department/:id" element={protectedPage(<EditDepartment />, ROLES.SUPER_ADMIN)} />
        <Route path="/create-project" element={protectedPage(<CreateProject />, ROLES.MANAGER)} />
        <Route path="/edit-project/:id" element={protectedPage(<EditProject />, ROLES.MANAGER)} />
        <Route path="/create-task" element={protectedPage(<CreateTask />, ROLES.TEAM_LEAD)} />
        <Route path="/edit-task/:id" element={protectedPage(<EditTask />, ROLES.TEAM_LEAD)} />
        <Route path="/create-attendance" element={protectedPage(<CreateAttendance />, ROLES.MANAGER)} />
        <Route path="/edit-attendance/:id" element={protectedPage(<EditAttendance />, ROLES.MANAGER)} />
        <Route path="/create-leave-request" element={protectedPage(<CreateLeaveRequest />)} />
        <Route path="/edit-leave-request/:id" element={protectedPage(<EditLeaveRequest />)} />
        <Route path="/change-password" element={protectedPage(<ChangePassword />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
