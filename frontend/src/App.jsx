import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, Users2, Clock, Sliders, BadgeDollarSign,
  Briefcase, CheckSquare, Ticket, Search, Bell, Settings, LogOut, KeyRound,
  Plus, Trash2, Edit, ArrowLeft, Menu, X, CheckCircle, AlertCircle, UserCheck,
  FileSpreadsheet, Download, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';

const apiBaseUrl = (() => {
  const urlValue = new URLSearchParams(window.location.search).get('apiBaseUrl');
  return (urlValue || window.__IT_ERP_CONFIG__?.apiBaseUrl || 'http://127.0.0.1:3000').replace(/\/+$/, '');
})();

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Request failed.');
  return data;
};

const globalCssOverride = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  
  #root {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    text-align: left !important;
    width: 100% !important;
  }
  
  body {
    font-family: 'Inter', sans-serif !important;
    background-color: #f8fafc !important;
    margin: 0 !important;
    display: block !important;
    min-width: 100% !important;
    min-height: 100vh !important;
    place-items: start !important;
  }
  
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }

  @media (max-width: 767px) {
    html, body, #root { min-height: 100dvh !important; }
    body { overscroll-behavior-y: none; }
    input, select, textarea { font-size: 16px !important; }
    .mobile-page-heading { padding-top: calc(env(safe-area-inset-top) + 0.75rem); }
    .mobile-bottom-nav { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
    .mobile-scroll-area { padding-bottom: calc(5.75rem + env(safe-area-inset-bottom)); }
  }
`;

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [users, setUsers] = useState([]);

  const [officeTimings, setOfficeTimings] = useState({
    inTime: '09:00', outTime: '18:00', graceMinutes: 15,
  });

  const [departments, setDepartments] = useState([]);

  const [teams, setTeams] = useState([]);

  const [attendance, setAttendance] = useState([]);

  const [projects, setProjects] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [tickets, setTickets] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const userRole = currentUser?.role || 'Employee';

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'CRM', 'Employee'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['Super Admin', 'Admin'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['Super Admin', 'Admin'] },
    { id: 'teams', label: 'Teams', icon: Users2, roles: ['Super Admin', 'Admin', 'Manager'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'Employee'] },
    { id: 'timing', label: 'Attendance Timing', icon: Sliders, roles: ['Super Admin', 'Admin'] },
    { id: 'payroll', label: 'Payroll', icon: BadgeDollarSign, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'Employee'] },
    { id: 'projects', label: 'Projects', icon: Briefcase, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'Employee'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'Employee'] },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'CRM', 'Employee'] },
    { id: 'lookup', label: 'Employee Lookup', icon: Search, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'CRM'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'CRM', 'Employee'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Admin', 'Team Leader', 'Manager', 'CRM', 'Employee'] },
    { id: 'platform', label: 'Workspaces', icon: Building2, roles: ['Super Admin'], platformOnly: true },
  ];

  const allowedNavItems = allNavItems.filter(item => item.roles.includes(userRole) && (!item.platformOnly || currentUser?.isPlatformAdmin));
  const activeNavItem = allNavItems.find(item => item.id === currentPage);

  const renderPageContent = () => {
    if (currentPage === 'login') {
      return (
        <LoginPage 
          onLoginSuccess={(user) => { setCurrentUser(user); setCurrentPage('dashboard'); }} 
          onForgot={() => setCurrentPage('forgot-password')} 
        />
      );
    }
  
    if (currentPage === 'forgot-password') {
      return <ForgotPasswordPage onBack={() => setCurrentPage('login')} />;
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans w-full">
        <div className="mobile-page-heading md:hidden bg-indigo-950 text-white px-5 pb-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-indigo-600/30 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div><span className="font-bold text-lg tracking-wide block leading-tight">NexERP</span><span className="text-[11px] text-indigo-300 font-semibold">{activeNavItem?.label || 'Workspace'}</span></div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 focus:outline-none hover:bg-white/10 rounded-lg transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
  
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
  
        <aside className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-out z-40 w-72 bg-indigo-950 text-slate-300 flex flex-col flex-shrink-0 shadow-2xl md:shadow-none border-r border-indigo-900/50`}>
          <div className="hidden md:flex items-center space-x-3 px-6 py-6 border-b border-indigo-900/50">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">NexERP</span>
          </div>
  
          {currentUser && (
            <div className="px-6 py-5 bg-indigo-900/20 border-b border-indigo-900/50 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-400 to-indigo-600 text-white rounded-full shadow-md flex items-center justify-center font-bold text-lg ring-2 ring-indigo-900 ring-offset-2 ring-offset-indigo-950">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                <p className="text-indigo-300 text-xs font-medium truncate">{currentUser.role}</p>
              </div>
            </div>
          )}
  
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
  
          <div className="p-4 border-t border-indigo-900/50">
            <button
              onClick={() => { setCurrentUser(null); setCurrentPage('login'); }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-indigo-300 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
  
        <main className="mobile-scroll-area flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 mx-auto w-full bg-slate-50">
          <div className="max-w-[1600px] mx-auto w-full">
            {currentPage === 'dashboard' && <DashboardView user={currentUser} users={users} projects={projects} tickets={tickets} role={userRole} />}
            {currentPage === 'users' && <UsersView users={users} setUsers={setUsers} role={userRole} departments={departments} teams={teams} />}
            {currentPage === 'departments' && <DepartmentsView departments={departments} setDepartments={setDepartments} />}
            {currentPage === 'teams' && <TeamsView teams={teams} setTeams={setTeams} departments={departments} role={userRole} />}
            {currentPage === 'attendance' && <AttendanceView attendance={attendance} setAttendance={setAttendance} timings={officeTimings} users={users} currentUser={currentUser} role={userRole} />}
            {currentPage === 'timing' && <AttendanceTimingView timings={officeTimings} setTimings={setOfficeTimings} role={userRole} />}
            {currentPage === 'payroll' && <PayrollView users={users} attendance={attendance} currentUser={currentUser} role={userRole} />}
            {currentPage === 'projects' && <ProjectsView projects={projects} setProjects={setProjects} currentUser={currentUser} role={userRole} departments={departments} />}
            {currentPage === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} projects={projects} users={users} currentUser={currentUser} role={userRole} />}
            {currentPage === 'tickets' && <TicketsView tickets={tickets} setTickets={setTickets} currentUser={currentUser} role={userRole} />}
            {currentPage === 'lookup' && <EmployeeLookupView users={users} />}
            {currentPage === 'notifications' && <NotificationsView notifications={notifications} setNotifications={setNotifications} setCurrentPage={setCurrentPage} />}
            {currentPage === 'settings' && <SettingsView role={userRole} currentUser={currentUser} setUsers={setUsers} users={users} />}
            {currentPage === 'platform' && <PlatformWorkspacesView />}
          </div>
        </main>

        <nav className="mobile-bottom-nav md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <MobileNavButton active={currentPage === 'dashboard'} label="Home" icon={LayoutDashboard} onClick={() => setCurrentPage('dashboard')} />
          <MobileNavButton active={currentPage === 'tasks'} label="Tasks" icon={CheckSquare} onClick={() => setCurrentPage('tasks')} />
          <MobileNavButton active={currentPage === 'notifications'} label="Updates" icon={Bell} badge={notifications.length} onClick={() => setCurrentPage('notifications')} />
          <MobileNavButton active={mobileMenuOpen} label="Menu" icon={Menu} onClick={() => setMobileMenuOpen(true)} />
        </nav>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCssOverride }} />
      {renderPageContent()}
    </>
  );
}

function PlatformWorkspacesView() {
  const [companies, setCompanies] = useState([]);
  const [durationDays, setDurationDays] = useState(30);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const loadCompanies = async () => {
    try {
      setCompanies(await apiRequest('/platform/companies', { headers: { Authorization: `Bearer ${token}` } }));
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { loadCompanies(); }, []);
  const setAccess = async (id, status) => {
    try {
      await apiRequest(`/platform/companies/${id}/access`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, durationDays: Number(durationDays) }) });
      setMessage('Workspace access updated. Company data was preserved.');
      loadCompanies();
    } catch (error) { setMessage(error.message); }
  };
  return <div className="space-y-6 animate-in fade-in duration-300">
    <div><h1 className="text-3xl font-black text-slate-900">Workspace access</h1><p className="mt-1 text-sm font-medium text-slate-500">Platform-only controls for trials, renewals, and blocks. Blocking access never deletes company data.</p></div>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="text-sm font-bold text-slate-700">Access duration (days)</label><input className="w-24 rounded-lg border border-slate-300 px-3 py-2" min="1" type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} /> <span className="text-xs text-slate-500">Used when activating or extending a workspace.</span></div>
    {message && <div className="rounded-xl bg-indigo-50 p-3 text-sm font-semibold text-indigo-700">{message}</div>}
    <div className="space-y-3">{companies.map(company => <div key={company.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-slate-900">{company.name}</h2><p className="mt-1 text-sm text-slate-500">@{company.emailDomain} · {company._count.users} user{company._count.users === 1 ? '' : 's'} · <span className="font-bold">{company.status}</span></p><p className="mt-1 text-xs text-slate-400">Trial ends: {new Date(company.trialEndsAt).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setAccess(company.id, 'ACTIVE')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Activate / extend</button><button onClick={() => setAccess(company.id, 'TRIAL')} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white">Set trial</button><button onClick={() => setAccess(company.id, 'BLOCKED')} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Block</button></div></div></div>)}{companies.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No company workspaces yet.</div>}</div>
  </div>;
}

function MobileNavButton({ active, label, icon: Icon, badge, onClick }) {
  return (
    <button onClick={onClick} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition-colors ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 active:bg-slate-100'}`}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {badge > 0 && <span className="absolute right-1/4 top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[9px] leading-4 text-white">{badge}</span>}
    </button>
  );
}

function LoginPage({ onLoginSuccess, onForgot }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setIsWorking(true);
    setMessage('');
    try {
      if (mode === 'create') {
        const result = await apiRequest('/auth/register-company', {
          method: 'POST', body: JSON.stringify(form),
        });
        setMessage(`${result.message} Sign in with ${form.email}.`);
        setMode('signin');
        return;
      }
      const result = await apiRequest('/auth/login', {
        method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }),
      });
      localStorage.setItem('token', result.token);
      localStorage.setItem('company', JSON.stringify(result.company || null));
      onLoginSuccess({
        id: result.userId, employeeId: form.email, name: result.userName,
        role: result.roleName, company: result.company, isPlatformAdmin: result.isPlatformAdmin,
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsWorking(false);
    }
  };

  const isCreate = mode === 'create';
  return (
    <div className="min-h-[100dvh] bg-[#090d18] flex items-center justify-center p-4 sm:p-8 relative w-full text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,.22),transparent_38%)]" />
      <div className="w-full max-w-lg relative z-10">
        <p className="mb-8 text-center text-xs font-extrabold uppercase tracking-[.16em] text-violet-400">Secure multi-company workspace</p>
        <div className="rounded-[1.5rem] border border-violet-500/50 bg-[#131827] p-5 sm:p-8 shadow-2xl">
          <div className="mb-7 grid grid-cols-2 rounded-xl border border-slate-700/70 bg-[#101625] p-1">
            <button type="button" onClick={() => { setMode('signin'); setMessage(''); }} className={`rounded-lg py-3 text-sm font-bold ${!isCreate ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400'}`}>Sign In</button>
            <button type="button" onClick={() => { setMode('create'); setMessage(''); }} className={`rounded-lg py-3 text-sm font-bold ${isCreate ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400'}`}>Create Account</button>
          </div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600"><Building2 className="h-6 w-6" /></div>
            <h1 className="text-2xl font-black">{isCreate ? 'Create your workspace' : 'Welcome back'}</h1>
            <p className="mt-2 text-sm text-slate-400">{isCreate ? 'Start a private 30-day trial for your company.' : 'Use your company email to open your workspace.'}</p>
          </div>
          {message && <div className="mb-5 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-sm font-medium text-violet-200">{message}</div>}
          <form onSubmit={submit} className="space-y-4">
            {isCreate && <><AuthField label="Company name" value={form.companyName} onChange={setField('companyName')} placeholder="Guru Tech" /><AuthField label="Full name" value={form.name} onChange={setField('name')} placeholder="Your name" /></>}
            <AuthField label="Work email" type="email" value={form.email} onChange={setField('email')} placeholder="you@gurutech.com" />
            <div><div className="mb-2 flex justify-between"><label className="text-sm font-bold text-slate-200">Password</label>{!isCreate && <button type="button" onClick={onForgot} className="text-xs font-bold text-violet-400">Forgot?</button>}</div><input required minLength="8" type="password" value={form.password} onChange={setField('password')} placeholder="••••••••" className="w-full rounded-xl border border-slate-700 bg-[#0c1220] px-4 py-3.5 text-white outline-none focus:border-violet-500" /></div>
            <button disabled={isWorking} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-900/40 disabled:opacity-60">{isWorking ? 'Please wait…' : isCreate ? 'Create workspace' : 'Sign in to workspace'} <ChevronRight className="h-5 w-5" /></button>
          </form>
          {isCreate && <p className="mt-5 text-center text-xs leading-5 text-slate-500">Your email domain becomes your private workspace boundary. Only users with the same domain can be added.</p>}
        </div>
      </div>
    </div>
  );
}

function AuthField({ label, type = 'text', value, onChange, placeholder }) {
  return <div><label className="mb-2 block text-sm font-bold text-slate-200">{label}</label><input required type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-[#0c1220] px-4 py-3.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-500" /></div>;
}

function ForgotPasswordPage({ onBack }) {
  const [step, setStep] = useState(1);
  const [empId, setEmpId] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!empId.trim()) { setError('Please enter a valid Employee ID'); return; }
    setError(''); setStep(2);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4 relative w-full">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div className="bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl p-8 sm:p-10 max-w-md w-full relative z-10 border border-white/20 mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Reset Password</h2>
          <p className="text-sm text-slate-500 font-medium">We'll send a verification code to your registered email.</p>
        </div>
        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm font-semibold shadow-sm"><AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span></div>}
        
        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Employee ID</label><input type="text" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="EMP101" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none text-slate-900 font-medium text-sm transition-all" /></div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/30">Send Reset Link</button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm rounded-xl flex gap-3"><CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600"/><span>Code sent successfully to your work email.</span></div>
            <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Enter 6-Digit Code</label><input type="text" placeholder="123456" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 text-xl font-black tracking-[0.5em] text-center font-mono transition-all" /></div>
            <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">New Password</label><input type="password" placeholder="Enter new password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm transition-all" /></div>
            <button onClick={onBack} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/30">Reset & Sign In</button>
          </div>
        )}
        <div className="mt-8 text-center"><button onClick={onBack} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in</button></div>
      </div>
    </div>
  );
}

function DashboardView({ user, users, projects, tickets, role }) {
  const isAdmin = role === 'Super Admin' || role === 'Admin';
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1><p className="text-slate-500 text-sm font-medium mt-1">Here is what's happening in your workspace today.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {isAdmin && <StatCard icon={Users} title="Total Employees" value={users.length} color="indigo" />}
        <StatCard icon={Briefcase} title="Active Projects" value={projects.length} color="sky" />
        <StatCard icon={Ticket} title="Support Tickets" value={tickets.length} color="amber" />
        <StatCard icon={CheckCircle} title="System Status" value="Online" color="emerald" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-5 group">
      <div className={`p-4 rounded-xl border ${colorMap[color]} transition-transform group-hover:scale-110`}><Icon className="w-7 h-7" /></div>
      <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-2xl font-black text-slate-900">{value}</h3></div>
    </div>
  );
}

function UsersView({ users, setUsers, role, departments, teams }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUserObj, setEditUserObj] = useState(null);
  
  // Set password empty so placeholder is visible by default
  const [newUser, setNewUser] = useState({ id: '', password: '', name: '', role: 'Employee', dept: departments[0]?.name || 'Engineering', team: teams[0]?.name || 'Core Dev', phone: '', email: '', status: 'Active' });
  const isSuperAdmin = role === 'Super Admin';

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (editUserObj) { setUsers(users.map(u => u.id === editUserObj.id ? newUser : u)); setEditUserObj(null); } 
    else { setUsers([...users, newUser]); }
    setShowAddModal(false);
    setNewUser({ id: '', password: '', name: '', role: 'Employee', dept: departments[0]?.name || 'Engineering', team: teams[0]?.name || 'Core Dev', phone: '', email: '', status: 'Active' });
  };

  const handleEdit = (u) => { setEditUserObj(u); setNewUser(u); setShowAddModal(true); };
  const handleDelete = (id) => { if (confirm('Are you sure you want to delete this user?')) setUsers(users.filter(u => u.id !== id)); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Members</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage system access and roles.</p></div>
        {isSuperAdmin && <button onClick={() => { setEditUserObj(null); setShowAddModal(true); }} className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition-all"><Plus className="w-5 h-5" /> <span>Add User</span></button>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr><th className="px-6 py-5">Employee Info</th><th className="px-6 py-5">Role & Dept</th><th className="px-6 py-5">Contact</th><th className="px-6 py-5">Status</th>{isSuperAdmin && <th className="px-6 py-5 text-right">Actions</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100">{u.name.charAt(0)}</div>
                      <div><div className="font-bold text-slate-900">{u.name}</div><div className="font-mono text-xs text-slate-500">{u.id}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="font-semibold text-slate-800">{u.role}</div><div className="text-xs text-slate-500 mt-0.5">{u.dept} • {u.team}</div></td>
                  <td className="px-6 py-4"><div className="font-medium text-slate-700">{u.email || '-'}</div><div className="text-xs text-slate-500 mt-0.5">{u.phone || '-'}</div></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {u.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
                    {u.status}
                  </span></td>
                  {isSuperAdmin && <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">{editUserObj ? 'Edit Member Profile' : 'Register New Member'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Employee ID / Username</label>
                  <input required disabled={editUserObj} placeholder="Enter Username" value={newUser.id} onChange={(e) => setNewUser({...newUser, id: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium disabled:bg-slate-50 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                  <input required placeholder="Enter Password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                <input required placeholder="Enter Full Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="Employee">Employee</option><option value="Team Leader">Team Leader</option><option value="Manager">Manager</option><option value="Admin">Admin</option><option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Status</label>
                  <select value={newUser.status} onChange={(e) => setNewUser({...newUser, status: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Department</label>
                  <select value={newUser.dept} onChange={(e) => setNewUser({...newUser, dept: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Team</label>
                  <select value={newUser.team} onChange={(e) => setNewUser({...newUser, team: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    {teams.map(t => <option key={t.id} value={t.name}>{t.name} ({t.dept})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" placeholder="Enter Email Address" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phone</label>
                  <input placeholder="Enter Phone Number" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentsView({ departments, setDepartments }) {
  const [newDept, setNewDept] = useState('');
  const handleAdd = (e) => { e.preventDefault(); if (!newDept.trim()) return; setDepartments([...departments, { id: Date.now(), name: newDept }]); setNewDept(''); };
  const handleDelete = (id) => { if (confirm('Delete this department?')) setDepartments(departments.filter(d => d.id !== id)); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Departments</h1></div>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-xl bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <input type="text" placeholder="Enter new department name..." value={newDept} onChange={(e) => setNewDept(e.target.value)} className="flex-1 px-4 py-3 bg-transparent text-sm font-medium focus:outline-none" />
        <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md transition-all active:scale-95">Add</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {departments.map((d) => (
          <div key={d.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3"><div className="w-2 h-8 bg-indigo-500 rounded-full"></div><span className="font-extrabold text-slate-800 text-lg">{d.name}</span></div>
            <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsView({ teams, setTeams, departments }) {
  const [teamName, setTeamName] = useState('');
  const [dept, setDept] = useState(departments[0]?.name || '');
  const handleAdd = (e) => { e.preventDefault(); if (!teamName.trim()) return; setTeams([...teams, { id: Date.now(), name: teamName, dept }]); setTeamName(''); };
  const handleDelete = (id) => { setTeams(teams.filter(t => t.id !== id)); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Teams Structure</h1></div>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-3xl bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <input type="text" placeholder="Team Name..." value={teamName} onChange={(e) => setTeamName(e.target.value)} className="flex-1 px-4 py-3 bg-transparent text-sm font-medium focus:outline-none" />
        <div className="w-px bg-slate-200 hidden sm:block my-2"></div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-4 py-3 text-sm font-medium bg-transparent focus:outline-none min-w-[200px] text-slate-600">
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95">Create Team</button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDelete(t.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button></div>
            <Users2 className="w-8 h-8 text-indigo-400 mb-4" />
            <h4 className="font-extrabold text-slate-900 text-xl">{t.name}</h4>
            <span className="inline-block mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{t.dept}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceView({ attendance, setAttendance, timings, users, currentUser, role }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || '');
  const [timeIn, setTimeIn] = useState('09:10');
  const [timeOut, setTimeOut] = useState('18:45');
  const isAdmin = role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Team Leader';

  const displayedAttendance = isAdmin ? attendance : attendance.filter(a => a.empId === currentUser?.id);

  const handleManualAdd = (e) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUser);
    if (!user) return;
    const [inH, inM] = timeIn.split(':').map(Number);
    const [officeH, officeM] = timings.inTime.split(':').map(Number);
    const actualInMins = inH * 60 + inM;
    const officeInMins = officeH * 60 + officeM + Number(timings.graceMinutes);
    const lateMins = Math.max(0, actualInMins - officeInMins);
    const [outH, outM] = timeOut.split(':').map(Number);
    const [officeOutH, officeOutM] = timings.outTime.split(':').map(Number);
    const overtimeMins = Math.max(0, (outH * 60 + outM) - (officeOutH * 60 + officeOutM));

    setAttendance([{ id: `ATT-${Date.now()}`, empId: user.id, name: user.name, date: new Date().toISOString().split('T')[0], lateMins, overtimeMins, status: lateMins > 0 ? 'Late' : 'Present' }, ...attendance]);
    alert('✅ Log saved securely.');
  };

  const handleExcelUpload = (e) => {
    if (!e.target.files[0]) return;
    setTimeout(() => {
      setAttendance([...[{ id: `ATT-${Date.now()-1}`, empId: 'EMP101', name: 'Mahavishnu', date: '2026-08-11', lateMins: 0, overtimeMins: 30, status: 'Present' }], ...attendance]);
      alert('✅ Excel Sheet Synced.');
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Time & Attendance</h1><p className="text-slate-500 text-sm font-medium mt-1">Track presence, late marks, and overtime logs.</p></div>
      
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Clock className="w-24 h-24 text-indigo-500"/></div>
            <h3 className="text-lg font-black text-slate-900 mb-6 relative z-10">Manual Log Entry</h3>
            <form onSubmit={handleManualAdd} className="space-y-5 relative z-10">
              <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Employee</label><select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all">{users.map(u => <option key={u.id} value={u.id}>{u.id} - {u.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Clock In</label><input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /></div>
                <div><label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Clock Out</label><input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /></div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg active:scale-[0.98] transition-all">Save Record</button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-4"><FileSpreadsheet className="w-8 h-8" /></div>
              <h3 className="text-lg font-black text-slate-900">Bulk Import via Excel</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Upload .xlsx or .csv logs from bio-metric devices.</p>
            </div>
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 p-8 rounded-2xl text-center cursor-pointer transition-colors group">
              <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">Select File to Upload</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-widest">
              <tr><th className="px-6 py-5">Employee Info</th><th className="px-6 py-5">Date</th><th className="px-6 py-5">Late Impact</th><th className="px-6 py-5">Overtime</th><th className="px-6 py-5">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAttendance.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-slate-900">{a.name}</div><div className="font-mono text-xs text-slate-400 mt-0.5">{a.empId}</div></td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{a.date}</td>
                  <td className="px-6 py-4"><span className={`font-black ${a.lateMins > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{a.lateMins} m</span></td>
                  <td className="px-6 py-4"><span className={`font-black ${a.overtimeMins > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{a.overtimeMins} m</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceTimingView({ timings, setTimings, role }) {
  const canEdit = role === 'Super Admin' || role === 'Admin';
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Shift Timings</h1></div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Office Check-In</label><input type="time" disabled={!canEdit} value={timings.inTime} onChange={(e) => setTimings({ ...timings, inTime: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 disabled:opacity-60 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Office Check-Out</label><input type="time" disabled={!canEdit} value={timings.outTime} onChange={(e) => setTimings({ ...timings, outTime: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 disabled:opacity-60 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Grace Period (Mins)</label><input type="number" disabled={!canEdit} value={timings.graceMinutes} onChange={(e) => setTimings({ ...timings, graceMinutes: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 disabled:opacity-60 outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        {!canEdit && <p className="text-xs text-amber-700 font-bold bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Only Administrators can modify global shift rules.</p>}
      </div>
    </div>
  );
}

function PayrollView({ users, attendance, currentUser, role }) {
  const [baseSalaries, setBaseSalaries] = useState({});
  const [empId, setEmpId] = useState(users[0]?.id || '');
  const [salaryInput, setSalaryInput] = useState('50000');
  const [expandedId, setExpandedId] = useState(null);
  const isSuperAdmin = role === 'Super Admin' || role === 'Admin';

  const displayedUsers = isSuperAdmin ? users : users.filter(u => u.id === currentUser?.id);
  const handleSaveBase = (e) => { e.preventDefault(); setBaseSalaries({ ...baseSalaries, [empId]: Number(salaryInput) }); };
  const handleDownloadPDF = (u) => { alert(`Downloading Secure PDF Payslip for ${u.name}...`); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Payroll Engine</h1><p className="text-slate-500 text-sm font-medium mt-1">Automated salary calculations based on attendance logs.</p></div>
      
      {isSuperAdmin && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5">Set Compensation Base</h3>
          <form onSubmit={handleSaveBase} className="flex flex-col sm:flex-row gap-4">
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 sm:w-64">{users.map(u => <option key={u.id} value={u.id}>{u.id} - {u.name}</option>)}</select>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" placeholder="50000" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20 transition-all whitespace-nowrap">Save Base</button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {displayedUsers.map((u) => {
            const base = baseSalaries[u.id] || 45000;
            const userAtt = attendance.filter(a => a.empId === u.id);
            const totalOT = userAtt.reduce((acc, curr) => acc + curr.overtimeMins, 0);
            const totalLate = userAtt.reduce((acc, curr) => acc + curr.lateMins, 0);
            const otEarnings = Math.round((totalOT / 60) * 300);
            const lopDeductions = Math.round((totalLate / 60) * 200);
            const finalSalary = base + otEarnings - lopDeductions;
            const isExpanded = expandedId === u.id;

            return (
              <div key={u.id} className={`transition-all duration-300 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                <div onClick={() => setExpandedId(isExpanded ? null : u.id)} className="p-6 cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center space-x-5">
                    <div className="hidden sm:flex w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl items-center justify-center font-black text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">{u.id.replace('EMP', '')}</div>
                    <div><h4 className="font-black text-slate-900 text-lg">{u.name}</h4><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{u.role} • {u.dept}</p></div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right"><span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-widest mb-1">Net Pay</span><span className="font-black text-indigo-600 text-xl tracking-tight">₹{finalSalary.toLocaleString()}</span></div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}><ChevronDown className="w-5 h-5" /></div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div><span className="text-slate-400 block text-[10px] font-black uppercase tracking-widest mb-2">Base Salary</span><span className="font-black text-slate-800 text-lg">₹{base.toLocaleString()}</span></div>
                        <div><span className="text-slate-400 block text-[10px] font-black uppercase tracking-widest mb-2">Overtime Bonus</span><span className="font-black text-emerald-500 text-lg">+₹{otEarnings}</span><p className="text-xs text-slate-400 font-medium mt-1">{totalOT} mins logged</p></div>
                        <div><span className="text-slate-400 block text-[10px] font-black uppercase tracking-widest mb-2">LOP Deductions</span><span className="font-black text-rose-500 text-lg">-₹{lopDeductions}</span><p className="text-xs text-slate-400 font-medium mt-1">{totalLate} mins late</p></div>
                        <div className="flex flex-col justify-end">
                          <button onClick={() => handleDownloadPDF(u)} className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md active:scale-95 transition-all"><Download className="w-4 h-4" /><span>Export PDF</span></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ projects, setProjects, currentUser, role, departments }) {
  const [showModal, setShowModal] = useState(false);
  const [newProj, setNewProj] = useState({ id: `PRJ-${Date.now()}`, name: '', desc: '', client: '', dept: departments[0]?.name || 'Engineering', status: 'In Progress', deadline: '2026-10-01', priority: 'Medium' });
  const canManage = role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Team Leader';

  const displayedProjects = (role === 'Super Admin' || role === 'Admin') ? projects : projects.filter(p => p.dept === currentUser?.dept);

  const handleAddProj = (e) => {
    e.preventDefault();
    setProjects([newProj, ...projects]);
    setShowModal(false);
    setNewProj({ id: `PRJ-${Date.now()}`, name: '', desc: '', client: '', dept: departments[0]?.name || 'Engineering', status: 'In Progress', deadline: '2026-10-01', priority: 'Medium' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Projects Matrix</h1><p className="text-slate-500 text-sm font-medium mt-1">Track departmental scopes and timelines.</p></div>
        {canManage && <button onClick={() => setShowModal(true)} className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition-all"><Plus className="w-5 h-5" /> <span>New Project</span></button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedProjects.map((p) => (
          <div key={p.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${p.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
            <div className="flex justify-between items-start mb-4 gap-4">
              <h3 className="font-black text-slate-900 text-xl leading-tight">{p.name}</h3>
              <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{p.status}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 flex-1">{p.desc || 'No specific description outlined.'}</p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Entity</p><p className="font-bold text-slate-800">{p.client}</p></div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg">{p.dept}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {p.deadline}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${p.priority === 'Urgent' || p.priority === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Initialize Project Phase</h3>
            <form onSubmit={handleAddProj} className="space-y-5">
              <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Title</label><input required value={newProj.name} onChange={(e) => setNewProj({...newProj, name: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Scope / Description</label><textarea value={newProj.desc} onChange={(e) => setNewProj({...newProj, desc: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" /></div>
              <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Client / Stakeholder</label><input required value={newProj.client} onChange={(e) => setNewProj({...newProj, client: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Department</label><select value={newProj.dept} onChange={(e) => setNewProj({...newProj, dept: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Priority</label><select value={newProj.priority} onChange={(e) => setNewProj({...newProj, priority: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select></div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95">Deploy Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksView({ tasks, setTasks, projects, users, currentUser, role }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [project, setProject] = useState(projects[0]?.name || ''); const [assignee, setAssignee] = useState(users[0]?.name || '');
  
  const canAssign = role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Team Leader';
  const displayedTasks = canAssign ? tasks : tasks.filter(t => t.assignee === currentUser?.name);
  const sortedTasks = [...displayedTasks].sort((a, b) => a.id - b.id);

  const handleCreateTask = (e) => {
    e.preventDefault();
    setTasks([...tasks, { id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 101, title, desc, project, assignee, creator: currentUser?.name || 'Admin', status: 'In Progress', deadline: '2026-08-20' }]); 
    setTitle(''); setDesc('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Task Directory</h1>
      {canAssign && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 pb-3 border-b border-slate-100">Delegate Assignment</h3>
          <form onSubmit={handleCreateTask} className="space-y-5">
            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label><input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Linked Project</label><select value={project} onChange={(e) => setProject(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignee</label><select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">{users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
            </div>
            <div className="pt-2"><button type="submit" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md active:scale-95 transition-all">Submit Assignment</button></div>
          </form>
        </div>
      )}
      <div className="space-y-4">
        {sortedTasks.map((t) => (
          <div key={t.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0"><CheckSquare className="w-6 h-6 text-slate-400" /></div>
            <div className="flex-1"><h4 className="font-extrabold text-slate-900 text-lg">{t.title}</h4><p className="text-sm font-medium text-slate-500 mt-1">{t.desc || 'No instructions provided.'}</p></div>
            <div className="flex flex-col sm:items-end gap-2">
              <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{t.status}</span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded">{t.project}</span> • <span>Assigned to: <span className="text-slate-800">{t.assignee}</span></span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketsView({ tickets, setTickets, currentUser, role }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const canCreate = role !== 'Employee';
  const canApprove = role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Team Leader';

  const displayedTickets = (role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Team Leader') ? tickets : tickets.filter(t => t.empId === currentUser?.id);

  const handleCreate = (e) => { e.preventDefault(); setTickets([...tickets, { id: `TCK-00${tickets.length + 1}`, empId: currentUser?.id, title, desc, priority: 'Medium', status: 'In Progress' }]); setTitle(''); setDesc(''); };
  const handleStatusChange = (id, newStatus) => { setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t)); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">IT Support Hub</h1>
      {canCreate && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-5"><Ticket className="w-48 h-48 text-indigo-900"/></div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 relative z-10">Raise Support Ticket</h3>
          <div className="relative z-10"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Title</label><input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div className="relative z-10"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label><textarea required value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" /></div>
          <button type="submit" className="relative z-10 bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md active:scale-95 transition-all">Submit Ticket</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedTickets.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-lg transition-all">
            <div className="flex justify-between items-center mb-4"><span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded font-black tracking-widest">{t.id}</span><span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{t.status}</span></div>
            <h4 className="font-black text-slate-900 text-lg mb-2">{t.title}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">{t.desc}</p>
            {canApprove && (
              <div className="pt-5 mt-5 border-t border-slate-100 flex gap-3">
                <button onClick={() => handleStatusChange(t.id, 'In Progress')} className="flex-1 py-2.5 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-bold transition-colors">In Progress</button>
                <button onClick={() => handleStatusChange(t.id, 'Completed')} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors">Resolve</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeLookupView({ users }) {
  const [searchId, setSearchId] = useState(''); const [selectedUser, setSelectedUser] = useState(null);
  const handleSearch = (e) => { e.preventDefault(); setSelectedUser(users.find(u => u.id.toLowerCase() === searchId.trim().toLowerCase()) || null); };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directory Lookup</h1>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by EMP ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-800 shadow-md active:scale-95 transition-all">Search</button>
      </form>
      {selectedUser && (
        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">{selectedUser.name.charAt(0)}</div>
            <div><h3 className="text-2xl font-black">{selectedUser.name}</h3><p className="text-indigo-200 font-bold tracking-widest uppercase text-[10px] mt-1">{selectedUser.id}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div className="bg-indigo-700/50 p-4 rounded-2xl border border-indigo-500/50"><span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest block mb-1">Role</span><div className="font-bold">{selectedUser.role}</div></div>
            <div className="bg-indigo-700/50 p-4 rounded-2xl border border-indigo-500/50"><span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest block mb-1">Department</span><div className="font-bold">{selectedUser.dept} • {selectedUser.team}</div></div>
            <div className="bg-indigo-700/50 p-4 rounded-2xl border border-indigo-500/50 sm:col-span-2"><span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest block mb-1">Contact</span><div className="font-bold">{selectedUser.email}</div><div className="text-indigo-200 mt-1">{selectedUser.phone}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsView({ notifications, setNotifications, setCurrentPage }) {
  const handleNotificationClick = (id, targetPage) => { setNotifications(notifications.filter(n => n.id !== id)); setCurrentPage(targetPage); };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inbox</h1>
      {notifications.length === 0 ? (<div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm"><Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" /><p className="text-lg font-black text-slate-400">All caught up!</p></div>) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => handleNotificationClick(n.id, n.targetPage)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Bell className="w-5 h-5" /></div>
                <span className="text-sm text-slate-800 font-bold">{n.text}</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">Open →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ currentUser, setUsers, users }) {
  const [oldPass, setOldPass] = useState(''); const [newPass, setNewPass] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (oldPass !== currentUser.password) { setError('Current password verification failed.'); setMessage(''); return; }
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u));
    currentUser.password = newPass;
    setMessage('Security credentials updated successfully.'); setError(''); setOldPass(''); setNewPass('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Preferences</h1>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4"><div className="p-2 bg-slate-100 rounded-lg"><KeyRound className="w-5 h-5 text-slate-600" /></div> Authentication details</h3>
        {message && <div className="p-4 bg-emerald-50 text-emerald-800 font-bold text-sm rounded-xl flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-600" /> {message}</div>}
        {error && <div className="p-4 bg-rose-50 text-rose-800 font-bold text-sm rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5 text-rose-600" /> {error}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label><input type="password" required value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label><input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" /></div>
          <div className="pt-2"><button type="submit" className="bg-slate-900 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-md active:scale-95 transition-all">Update Security</button></div>
        </form>
      </div>
    </div>
  );
}
