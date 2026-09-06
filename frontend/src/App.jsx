import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Users2,
  Clock,
  Sliders,
  BadgeDollarSign,
  Briefcase,
  CheckSquare,
  Ticket,
  Search,
  Bell,
  Settings,
  LogOut,
  KeyRound,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';

function App() {
  // Authentication State
  const [currentPage, setCurrentPage] = useState('login'); 
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Registered Users List
  const [users, setUsers] = useState([
    { id: 'EMP101', password: 'admin123', name: 'Mahavishnu', role: 'Super Admin', dept: 'Product Design', team: 'Core Dev', phone: '+91 9876543210', email: 'vishnu@company.com', status: 'Active' },
    { id: 'EMP102', password: 'mgr123', name: 'Vishnu', role: 'Manager', dept: 'UI/UX Design', team: 'Product UI', phone: '+91 9876500000', email: 'susheyy@company.com', status: 'Active' },
    { id: 'EMP103', password: 'emp123', name: 'Maha', role: 'Employee', dept: 'Engineering', team: 'Backend', phone: '+91 9123456789', email: 'arun@company.com', status: 'Active' }
  ]);

  // Operational Data States
  const [officeTimings, setOfficeTimings] = useState({
    inTime: '09:00',
    outTime: '18:00',
    graceMinutes: 15,
  });

  const [departments, setDepartments] = useState([
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'UI/UX Design' },
    { id: 3, name: 'Human Resources' },
    { id: 4, name: 'CRM & Support' }
  ]);

  const [teams, setTeams] = useState([
    { id: 1, name: 'Core Dev', dept: 'Engineering' },
    { id: 2, name: 'Product UI', dept: 'UI/UX Design' },
    { id: 3, name: 'Customer Success', dept: 'CRM & Support' }
  ]);

  const [attendance, setAttendance] = useState([
    { id: 'ATT01', empId: 'EMP101', name: 'Vishnu Kannan', date: '2026-08-10', lateMins: 0, overtimeMins: 45, status: 'Present' },
    { id: 'ATT02', empId: 'EMP102', name: 'Susheyy R', date: '2026-08-10', lateMins: 20, overtimeMins: 0, status: 'Late' }
  ]);

  const [projects, setProjects] = useState([
    { id: 'PRJ1', name: 'EV Charging Station App', client: 'GreenEnergy Co', dept: 'UI/UX Design', status: 'In Progress', deadline: '2026-09-15', priority: 'High' },
    { id: 'PRJ2', name: 'ERP System Frontend', client: 'Internal', dept: 'Engineering', status: 'In Progress', deadline: '2026-08-30', priority: 'Urgent' },
    { id: 'PRJ3', name: 'Medical Clinic Landing Page', client: 'Apollo Clinic', dept: 'UI/UX Design', status: 'Completed', deadline: '2026-07-20', priority: 'Medium' }
  ]);

  const [tasks, setTasks] = useState([
    { id: 101, title: 'Design Figma Wireframes for ERP', project: 'ERP System Frontend', assignee: 'Susheyy R', creator: 'Vishnu Kannan', completedBy: '', status: 'In Progress', deadline: '2026-08-15' },
    { id: 102, title: 'Setup React Components Structure', project: 'ERP System Frontend', assignee: 'Vishnu Kannan', creator: 'Vishnu Kannan', completedBy: 'Vishnu Kannan', status: 'Completed', deadline: '2026-08-11' }
  ]);

  const [tickets, setTickets] = useState([
    { id: 'TCK-001', title: 'Login API latency in production', desc: 'Auth server takes > 3s to respond', priority: 'High', status: 'In Progress' },
    { id: 'TCK-002', title: 'Add dark mode support', desc: 'Client requested dark theme', priority: 'Low', status: 'Pending Approval' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New support ticket assigned to your team', targetPage: 'tickets' },
    { id: 2, text: 'Task #101 deadline approaching in 2 days', targetPage: 'tasks' },
    { id: 3, text: 'Monthly payroll generation ready for review', targetPage: 'payroll' }
  ]);

  // Auth pages standalone handling
  if (currentPage === 'login') {
    return (
      <LoginPage 
        users={users} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage('dashboard');
        }} 
        onForgot={() => setCurrentPage('forgot-password')} 
      />
    );
  }

  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage onBack={() => setCurrentPage('login')} />;
  }

  const userRole = currentUser?.role || 'Employee';

  // ROLE BASED NAVIGATION (Sidebar)
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Manager', 'CRM', 'Employee'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['Super Admin', 'Admin'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['Super Admin', 'Admin'] },
    { id: 'teams', label: 'Teams', icon: Users2, roles: ['Super Admin', 'Admin', 'Manager'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Super Admin', 'Admin', 'Manager', 'Employee'] },
    { id: 'timing', label: 'Attendance Timing', icon: Sliders, roles: ['Super Admin', 'Admin'] },
    { id: 'payroll', label: 'Payroll', icon: BadgeDollarSign, roles: ['Super Admin', 'Admin'] },
    { id: 'projects', label: 'Projects', icon: Briefcase, roles: ['Super Admin', 'Admin', 'Manager'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Super Admin', 'Admin', 'Manager', 'Employee'] },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket, roles: ['Super Admin', 'Admin', 'Manager', 'CRM', 'Employee'] },
    { id: 'lookup', label: 'Employee Lookup', icon: Search, roles: ['Super Admin', 'Admin', 'Manager', 'CRM', 'Employee'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length, roles: ['Super Admin', 'Admin', 'Manager', 'CRM', 'Employee'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Manager', 'CRM', 'Employee'] },
  ];

  // Filter items based on Logged-in User's Role
  const allowedNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      <div className="md:hidden bg-teal-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg tracking-wide">IT ERP System</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 focus:outline-none">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-40 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl`}>
        <div className="hidden md:flex items-center space-x-3 p-6 border-b border-slate-800">
          <Building2 className="w-8 h-8 text-teal-400" />
          <span className="font-bold text-xl text-white tracking-wider">IT ERP</span>
        </div>

        {currentUser && (
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-800 text-xs flex items-center space-x-3">
            <div className="p-2 bg-teal-600 text-white rounded-full">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{currentUser.name}</p>
              <p className="text-teal-400 text-xs">{currentUser.role} ({currentUser.id})</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-emerald-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              setCurrentUser(null);
              setCurrentPage('login');
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentPage === 'dashboard' && <DashboardView user={currentUser} users={users} projects={projects} tickets={tickets} role={userRole} />}
        {currentPage === 'users' && <UsersView users={users} setUsers={setUsers} role={userRole} />}
        {currentPage === 'departments' && <DepartmentsView departments={departments} setDepartments={setDepartments} />}
        {currentPage === 'teams' && <TeamsView teams={teams} setTeams={setTeams} departments={departments} role={userRole} />}
        {currentPage === 'attendance' && <AttendanceView attendance={attendance} setAttendance={setAttendance} timings={officeTimings} users={users} role={userRole} />}
        {currentPage === 'timing' && <AttendanceTimingView timings={officeTimings} setTimings={setOfficeTimings} role={userRole} />}
        {currentPage === 'payroll' && <PayrollView users={users} attendance={attendance} role={userRole} />}
        {currentPage === 'projects' && <ProjectsView projects={projects} setProjects={setProjects} role={userRole} />}
        {currentPage === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} projects={projects} users={users} currentUser={currentUser} />}
        {currentPage === 'tickets' && <TicketsView tickets={tickets} setTickets={setTickets} role={userRole} />}
        {currentPage === 'lookup' && <EmployeeLookupView users={users} />}
        {currentPage === 'notifications' && <NotificationsView notifications={notifications} setNotifications={setNotifications} setCurrentPage={setCurrentPage} />}
        {currentPage === 'settings' && <SettingsView role={userRole} currentUser={currentUser} setUsers={setUsers} users={users} />}
      </main>
    </div>
  );
}

// ---------------- 1. LOGIN PAGE (AUTHENTICATED) ----------------
function LoginPage({ users, onLoginSuccess, onForgot }) {
  const [empIdInput, setEmpIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      u => u.id.toLowerCase() === empIdInput.trim().toLowerCase() && u.password === passwordInput
    );

    if (foundUser) {
      setErrorMsg('');
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Invalid Employee ID or Password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-teal-50 rounded-full text-teal-600 mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">IT ERP Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in with your Employee ID & Password</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Employee ID</label>
            <input
              type="text"
              required
              value={empIdInput}
              onChange={(e) => setEmpIdInput(e.target.value)}
              placeholder="Enter Username or Employee ID"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgot}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition duration-150 shadow-md text-sm"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
          <p className="font-bold text-slate-800 mb-2 border-b pb-1">Demo Login Passwords:</p>
          <div className="flex justify-between"><span>Super Admin:</span> <span className="font-mono font-semibold text-teal-600">EMP101 / admin123</span></div>
          <div className="flex justify-between"><span>Manager:</span> <span className="font-mono font-semibold text-teal-600">EMP102 / mgr123</span></div>
          <div className="flex justify-between"><span>Employee:</span> <span className="font-mono font-semibold text-teal-600">EMP103 / emp123</span></div>
        </div>
      </div>
    </div>
  );
}

// ---------------- 2. FORGOT PASSWORD PAGE ----------------
function ForgotPasswordPage({ onBack }) {
  const [step, setStep] = useState(1);
  const [empId, setEmpId] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!empId.trim()) {
      setError('Please enter a valid Employee ID');
      return;
    }
    setError('');
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Reset Password</h2>
        <p className="text-xs text-slate-500 mb-6">Verification code will be sent to your registered email address.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Employee ID</label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="EMP101"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm"
              />
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition duration-150 text-sm shadow-md">
              Send code
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
              Verification code sent to your registered work email.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Enter 6-Digit Code</label>
              <input type="text" placeholder="123456" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm tracking-widest text-center font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password</label>
              <input type="password" placeholder="Enter new password" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 text-sm" />
            </div>
            <button onClick={onBack} className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition duration-150 text-sm shadow-md">
              Reset Password & Sign In
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={onBack} className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3 h-3 mr-1" /> Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- 3. DASHBOARD PAGE ----------------
function DashboardView({ user, users, projects, tickets, role }) {
  const isAdmin = role === 'Super Admin' || role === 'Admin';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name || 'User'}!</h1>
        <p className="text-slate-500 text-sm mt-0.5">Workspace overview and operational metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Employees</p>
              <h3 className="text-xl font-bold text-slate-800">{users.length}</h3>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Projects</p>
            <h3 className="text-xl font-bold text-slate-800">{projects.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Support Tickets</p>
            <h3 className="text-xl font-bold text-slate-800">{tickets.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">System Status</p>
            <h3 className="text-xl font-bold text-emerald-600">Operational</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Workspace Overview</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Welcome to your centralized IT Resource Planning system. Your access is personalized based on your role <strong>({user?.role})</strong>.
        </p>
      </div>
    </div>
  );
}

// ---------------- 4. USERS PAGE ----------------
function UsersView({ users, setUsers, role }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', password: 'user123', name: '', role: 'Employee', dept: 'Engineering', team: '', phone: '', email: '', status: 'Active' });
  const isSuperAdmin = role === 'Super Admin';

  const handleCreateUser = (e) => {
    e.preventDefault();
    setUsers([...users, newUser]);
    setShowAddModal(false);
    setNewUser({ id: '', password: 'user123', name: '', role: 'Employee', dept: 'Engineering', team: '', phone: '', email: '', status: 'Active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm">Manage system access and team employee details.</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-sm">
            <Plus className="w-4 h-4" /> <span>Add User</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="p-4">Emp ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Team</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-slate-800 font-semibold">{u.id}</td>
                  <td className="p-4 font-medium text-slate-800">{u.name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">{u.role}</span></td>
                  <td className="p-4">{u.dept || ''}</td>
                  <td className="p-4">{u.team || ''}</td>
                  <td className="p-4 text-xs">
                    {u.email && <div>{u.email}</div>}
                    {u.phone && <div className="text-slate-400">{u.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input placeholder="Emp ID (e.g. EMP104)" required value={newUser.id} onChange={(e) => setNewUser({...newUser, id: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <input placeholder="Password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <input placeholder="Full Name" required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full p-2 border rounded text-sm">
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
              <input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <input placeholder="Phone" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded text-sm">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- 5. DEPARTMENTS PAGE ----------------
function DepartmentsView({ departments, setDepartments }) {
  const [newDept, setNewDept] = useState('');
  const handleAdd = (e) => { e.preventDefault(); if (!newDept.trim()) return; setDepartments([...departments, { id: Date.now(), name: newDept }]); setNewDept(''); };
  const handleRename = (id) => { const name = prompt('Enter new department name:'); if (name) setDepartments(departments.map(d => d.id === id ? { ...d, name } : d)); };
  const handleDelete = (id) => { if (confirm('Delete this department?')) setDepartments(departments.filter(d => d.id !== id)); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
      <form onSubmit={handleAdd} className="flex gap-2 max-w-md">
        <input type="text" placeholder="New Department Name" value={newDept} onChange={(e) => setNewDept(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700">Add</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="font-semibold text-slate-800 text-sm">{d.name}</span>
            <div className="flex space-x-2">
              <button onClick={() => handleRename(d.id)} className="p-1 text-slate-400 hover:text-teal-600"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(d.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- 6. TEAMS PAGE ----------------
function TeamsView({ teams, setTeams, departments }) {
  const [teamName, setTeamName] = useState('');
  const [dept, setDept] = useState(departments[0]?.name || '');
  const handleAdd = (e) => { e.preventDefault(); if (!teamName.trim()) return; setTeams([...teams, { id: Date.now(), name: teamName, dept }]); setTeamName(''); };
  const handleDelete = (id) => { setTeams(teams.filter(t => t.id !== id)); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 max-w-xl">
        <input type="text" placeholder="Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700">Create Team</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{t.name}</h4>
              <p className="text-xs text-slate-500">{t.dept}</p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- 7. ATTENDANCE PAGE ----------------
function AttendanceView({ attendance, setAttendance, timings, users, role }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || '');
  const [timeIn, setTimeIn] = useState('09:10');
  const [timeOut, setTimeOut] = useState('18:45');
  const isAdmin = role === 'Super Admin' || role === 'Admin' || role === 'Manager';

  const handleManualAdd = (e) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUser);
    const [inH, inM] = timeIn.split(':').map(Number);
    const [officeH, officeM] = timings.inTime.split(':').map(Number);
    const actualInMins = inH * 60 + inM;
    const officeInMins = officeH * 60 + officeM + Number(timings.graceMinutes);
    const lateMins = Math.max(0, actualInMins - officeInMins);
    const [outH, outM] = timeOut.split(':').map(Number);
    const [officeOutH, officeOutM] = timings.outTime.split(':').map(Number);
    const actualOutMins = outH * 60 + outM;
    const officeOutMins = officeOutH * 60 + officeOutM;
    const overtimeMins = Math.max(0, actualOutMins - officeOutMins);

    const record = {
      id: `ATT-${Date.now()}`, empId: user.id, name: user.name, date: new Date().toISOString().split('T')[0],
      lateMins, overtimeMins, status: lateMins > 0 ? 'Late' : 'Present'
    };
    setAttendance([record, ...attendance]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Manual Entry</h3>
          <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Employee</label>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-2 border rounded text-sm">
                {users.map(u => <option key={u.id} value={u.id}>{u.id} - {u.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Check In Time</label><input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="w-full p-2 border rounded text-sm" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Check Out Time</label><input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className="w-full p-2 border rounded text-sm" /></div>
            <button type="submit" className="bg-teal-600 text-white p-2 rounded text-sm font-semibold hover:bg-teal-700">Save Record</button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-xs">
            <tr><th className="p-4">Emp ID</th><th className="p-4">Name</th><th className="p-4">Date</th><th className="p-4">Late Arrival</th><th className="p-4">Overtime</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendance.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-slate-800 font-medium">{a.empId}</td>
                <td className="p-4">{a.name}</td><td className="p-4">{a.date}</td>
                <td className="p-4 text-amber-600 font-medium">{a.lateMins} mins</td>
                <td className="p-4 text-emerald-600 font-medium">{a.overtimeMins} mins</td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- 8. ATTENDANCE TIMING PAGE ----------------
function AttendanceTimingView({ timings, setTimings, role }) {
  const canEdit = role === 'Super Admin' || role === 'Admin';
  return (
    <div className="space-y-6 max-w-xl">
      <div><h1 className="text-2xl font-bold text-slate-800">Attendance Timing Settings</h1></div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Office In-Time</label><input type="time" disabled={!canEdit} value={timings.inTime} onChange={(e) => setTimings({ ...timings, inTime: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm disabled:bg-slate-100" /></div>
        <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Office Out-Time</label><input type="time" disabled={!canEdit} value={timings.outTime} onChange={(e) => setTimings({ ...timings, outTime: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm disabled:bg-slate-100" /></div>
        <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Grace Period (Minutes)</label><input type="number" disabled={!canEdit} value={timings.graceMinutes} onChange={(e) => setTimings({ ...timings, graceMinutes: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm disabled:bg-slate-100" /></div>
        {!canEdit && <p className="text-xs text-amber-600 italic">Only Admins and Super Admins can alter timing configurations.</p>}
      </div>
    </div>
  );
}

// ---------------- 9. PAYROLL PAGE ----------------
function PayrollView({ users, attendance, role }) {
  const [baseSalaries, setBaseSalaries] = useState({});
  const [empId, setEmpId] = useState(users[0]?.id || '');
  const [salaryInput, setSalaryInput] = useState('50000');
  const isSuperAdmin = role === 'Super Admin';

  const handleSaveBase = (e) => { e.preventDefault(); setBaseSalaries({ ...baseSalaries, [empId]: Number(salaryInput) }); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Payroll Workspace</h1>
      {isSuperAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase">Set Employee Base Salary</h3>
          <form onSubmit={handleSaveBase} className="flex gap-2 max-w-md">
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="p-2 border rounded text-sm">{users.map(u => <option key={u.id} value={u.id}>{u.id} - {u.name}</option>)}</select>
            <input type="number" placeholder="Salary (₹)" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} className="p-2 border rounded text-sm flex-1" />
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-teal-700">Save</button>
          </form>
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800">Generated Payroll List</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((u) => {
            const base = baseSalaries[u.id] || 45000;
            const userAtt = attendance.filter(a => a.empId === u.id);
            const totalOT = userAtt.reduce((acc, curr) => acc + curr.overtimeMins, 0);
            const totalLate = userAtt.reduce((acc, curr) => acc + curr.lateMins, 0);
            const otEarnings = Math.round((totalOT / 60) * 300);
            const lopDeductions = Math.round((totalLate / 60) * 200);
            const finalSalary = base + otEarnings - lopDeductions;
            return (
              <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b pb-2">
                  <div><span className="font-mono text-xs text-teal-600 font-bold">2026-08_{u.id}</span><h4 className="font-bold text-slate-800 text-base">{u.name}</h4><p className="text-xs text-slate-500">Emp ID: {u.id}</p></div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Generated</span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between"><span>Base Salary:</span> <span className="font-semibold">₹{base.toLocaleString()}</span></div>
                  <div className="flex justify-between text-emerald-600"><span>Overtime Earnings ({totalOT} mins):</span> <span>+₹{otEarnings}</span></div>
                  <div className="flex justify-between text-red-500"><span>Loss of Pay ({totalLate} mins):</span> <span>-₹{lopDeductions}</span></div>
                  <div className="flex justify-between font-bold text-slate-800 text-sm pt-2 border-t"><span>Final Payable Salary:</span> <span>₹{finalSalary.toLocaleString()}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------- 10. PROJECTS PAGE ----------------
function ProjectsView({ projects }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-800 text-base">{p.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span>
            </div>
            <p className="text-xs text-slate-500">Client: <span className="font-medium text-slate-700">{p.client}</span></p>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t">
              <div className="flex justify-between"><span>Department:</span> <span>{p.dept}</span></div>
              <div className="flex justify-between"><span>Deadline:</span> <span>{p.deadline}</span></div>
              <div className="flex justify-between"><span>Priority:</span> <span className="font-semibold text-amber-600">{p.priority}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- 11. TASKS PAGE ----------------
function TasksView({ tasks, setTasks, projects, users, currentUser }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(projects[0]?.name || '');
  const [assignee, setAssignee] = useState(users[0]?.name || '');
  const sortedTasks = [...tasks].sort((a, b) => a.id - b.id);
  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const handleCreateTask = (e) => {
    e.preventDefault();
    const newTask = { id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 101, title, project, assignee, creator: currentUser?.name || 'Admin', completedBy: '', status: 'In Progress', deadline: '2026-08-20' };
    setTasks([...tasks, newTask]); setTitle('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tasks Workspace</h1>
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Create New Task</h3>
          <form onSubmit={handleCreateTask} className="flex flex-wrap gap-3">
            <input type="text" required placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[200px] p-2 border rounded text-sm" />
            <select value={project} onChange={(e) => setProject(e.target.value)} className="p-2 border rounded text-sm">{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="p-2 border rounded text-sm">{users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-teal-700">Create Task</button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-xs">
            <tr><th className="p-4">Task ID</th><th className="p-4">Title</th><th className="p-4">Project</th><th className="p-4">Assignee</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-slate-800">#{t.id}</td><td className="p-4 font-medium text-slate-800">{t.title}</td><td className="p-4">{t.project}</td><td className="p-4">{t.assignee}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- 12. SUPPORT TICKETS PAGE ----------------
function TicketsView({ tickets, setTickets, role }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const canCreate = role === 'CRM' || role === 'Super Admin' || role === 'Admin' || role === 'Employee';
  const canApprove = role === 'Manager' || role === 'Super Admin';

  const handleCreate = (e) => { e.preventDefault(); setTickets([...tickets, { id: `TCK-00${tickets.length + 1}`, title, desc, priority: 'Medium', status: 'In Progress' }]); setTitle(''); setDesc(''); };
  const handleStatusChange = (id, newStatus) => { setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t)); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
      {canCreate && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 max-w-xl">
          <h3 className="text-sm font-bold text-slate-700 uppercase">Create Support Ticket</h3>
          <input placeholder="Ticket Title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded text-sm" />
          <textarea placeholder="Description" required value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-2 border rounded text-sm h-20" />
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-teal-700">Submit Ticket</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start"><span className="font-mono text-xs text-teal-600 font-bold">{t.id}</span><span className={`text-xs px-2 py-0.5 rounded font-semibold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span></div>
            <h4 className="font-bold text-slate-800 text-base">{t.title}</h4><p className="text-xs text-slate-600">{t.desc}</p>
            {canApprove && (
              <div className="pt-2 border-t flex space-x-2">
                <button onClick={() => handleStatusChange(t.id, 'In Progress')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Move In-Progress</button>
                <button onClick={() => handleStatusChange(t.id, 'Completed')} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Mark Completed</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- 13. EMPLOYEE LOOKUP PAGE ----------------
function EmployeeLookupView({ users }) {
  const [searchId, setSearchId] = useState(''); const [selectedUser, setSelectedUser] = useState(null);
  const handleSearch = (e) => { e.preventDefault(); setSelectedUser(users.find(u => u.id.toLowerCase() === searchId.trim().toLowerCase()) || null); };
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Employee Lookup</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input type="text" placeholder="Enter Employee ID (e.g. EMP101)" value={searchId} onChange={(e) => setSearchId(e.target.value)} className="flex-1 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button type="submit" className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700">Search</button>
      </form>
      {selectedUser && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{selectedUser.name}</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div><span className="text-xs text-slate-400 uppercase font-semibold block">Employee ID</span>{selectedUser.id}</div>
            {selectedUser.role && <div><span className="text-xs text-slate-400 uppercase font-semibold block">Role</span>{selectedUser.role}</div>}
            {selectedUser.dept && <div><span className="text-xs text-slate-400 uppercase font-semibold block">Department</span>{selectedUser.dept}</div>}
            {selectedUser.team && <div><span className="text-xs text-slate-400 uppercase font-semibold block">Team</span>{selectedUser.team}</div>}
            {selectedUser.email && <div><span className="text-xs text-slate-400 uppercase font-semibold block">Email</span>{selectedUser.email}</div>}
            {selectedUser.phone && <div className="whitespace-nowrap"><span className="text-xs text-slate-400 uppercase font-semibold block">Phone</span>{selectedUser.phone}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- 14. NOTIFICATIONS PAGE ----------------
function NotificationsView({ notifications, setNotifications, setCurrentPage }) {
  const handleNotificationClick = (id, targetPage) => { setNotifications(notifications.filter(n => n.id !== id)); setCurrentPage(targetPage); };
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
      {notifications.length === 0 ? (<p className="text-sm text-slate-500 bg-white p-6 rounded-xl border text-center">No unread notifications.</p>) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => handleNotificationClick(n.id, n.targetPage)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 cursor-pointer transition flex items-center justify-between">
              <span className="text-sm text-slate-800 font-medium">{n.text}</span><span className="text-xs text-teal-600 font-semibold">View →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- 15. SETTINGS PAGE ----------------
function SettingsView({ currentUser, setUsers, users }) {
  const [oldPass, setOldPass] = useState(''); const [newPass, setNewPass] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (oldPass !== currentUser.password) { setError('Current password is incorrect!'); setMessage(''); return; }
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u));
    currentUser.password = newPass;
    setMessage('Password updated successfully!'); setError(''); setOldPass(''); setNewPass('');
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><KeyRound className="w-5 h-5 text-teal-600" /> Change Password ({currentUser?.id})</h3>
        {message && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded">{message}</div>}
        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Current Password</label><input type="password" required value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 uppercase mb-1">New Password</label><input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" /></div>
          <button type="submit" className="bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700">Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default App;
