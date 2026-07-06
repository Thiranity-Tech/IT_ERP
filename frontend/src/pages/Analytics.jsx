import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";
import Layout from "../components/Layout";

function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    overview: {},
    projectStatus: {},
    leaveStatus: {},
    ticketStatus: {},
    payrollSummary: {},
    monthlyPayroll: [],
    attendance: {},
  });

  useEffect(() => {
    const requests = [
      api.get("/analytics/overview"),
      api.get("/analytics/project-status"),
      api.get("/analytics/leave-status"),
      api.get("/analytics/ticket-status"),
      api.get("/analytics/payroll-summary"),
      api.get("/analytics/monthly-payroll"),
      api.get("/analytics/attendance"),
    ];

    Promise.allSettled(requests).then((results) => {
      const nextAnalytics = {
        overview: {},
        projectStatus: {},
        leaveStatus: {},
        ticketStatus: {},
        payrollSummary: {},
        monthlyPayroll: [],
        attendance: {},
      };

      const failures = [];
      const keys = [
        "overview",
        "projectStatus",
        "leaveStatus",
        "ticketStatus",
        "payrollSummary",
        "monthlyPayroll",
        "attendance",
      ];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextAnalytics[keys[index]] = result.value.data;
        } else {
          failures.push(keys[index]);
          console.error(`Analytics fetch failed for ${keys[index]}`, result.reason);
        }
      });

      setAnalytics(nextAnalytics);

      if (failures.length) {
        console.warn(`Some analytics sections failed to load: ${failures.join(", ")}`);
      }
    });
  }, []);

  const projectChart = [
    { name: "Active", value: analytics.projectStatus.active || 0 },
    { name: "Completed", value: analytics.projectStatus.completed || 0 },
    { name: "Pending", value: analytics.projectStatus.pending || 0 },
  ];

  const leaveChart = [
    { name: "Pending", value: analytics.leaveStatus.pending || 0 },
    { name: "Approved", value: analytics.leaveStatus.approved || 0 },
    { name: "Rejected", value: analytics.leaveStatus.rejected || 0 },
  ];

  const attendanceChart = [
    ...(analytics.attendance.attendanceTrend || []),
  ];
  const payrollChart = (analytics.monthlyPayroll || []).map((item) => ({
    month: item.month,
    salary: item._sum?.finalSalary || 0,
    incentives: item._sum?.incentiveAmount || 0,
    lossOfPay: item._sum?.lossOfPay || 0,
  }));
  const hasAttendanceTrend = attendanceChart.some(
    (item) => item.lateArrivals > 0 || item.overtimeEntries > 0
  );

  const colors = ["#0b5ed7", "#0f766e", "#f59e0b", "#dc2626", "#475569"];
  const ticketStatusOrder = [
    "new",
    "submitted_for_approval",
    "approved",
    "in_progress",
    "resolved",
    "closed",
    "rejected",
  ];
  const ticketStatusEntries = ticketStatusOrder
    .map((key) => [key, analytics.ticketStatus[key] || 0])
    .filter(([, value]) => value > 0);

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">ERP overview</span>
            <h1>Analytics</h1>
            <p>View operational signals across projects, attendance, leave, tickets, and payroll.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/employee-analytics")} type="button">
            Employee lookup
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="label">Employees</div>
            <div className="value">{analytics.overview.totalEmployees || 0}</div>
          </div>
          <div className="stat-card">
            <div className="label">Attendance</div>
            <div className="value">{analytics.attendance.attendancePercentage || 0}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Working Days</div>
            <div className="value">{analytics.attendance.totalWorkingDays || 0}</div>
          </div>
          <div className="stat-card">
            <div className="label">Remaining Leave</div>
            <div className="value">{analytics.attendance.remainingLeaveDays || 0}</div>
          </div>
        </section>

        <section className="section-grid">
          <div className="workspace-card">
            <h3>Project status</h3>
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={projectChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0b5ed7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="workspace-card">
            <h3>Leave status</h3>
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={leaveChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {leaveChart.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="recent-grid">
          <div className="list-card">
            <h3>Late arrivals and overtime</h3>
            {hasAttendanceTrend ? (
              <div className="chart-frame chart-frame-sm">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={attendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => String(value).slice(5)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lateArrivals" name="Late arrivals" radius={[8, 8, 0, 0]} fill="#b54708" />
                    <Bar dataKey="overtimeEntries" name="Overtime entries" radius={[8, 8, 0, 0]} fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">No late arrivals or overtime recorded.</div>
            )}
            <div className="metric-strip">
              <span>Total overtime: {analytics.attendance.totalOvertimeHours || 0} hrs</span>
              <span>Leave used: {analytics.attendance.leaveDaysTaken || 0} / {analytics.attendance.leaveAllowanceDays || 0}</span>
            </div>
          </div>

          <div className="list-card">
            <h3>Payroll</h3>
            {payrollChart.length > 0 && (
              <div className="chart-frame chart-frame-sm">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={payrollChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5eaf0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="salary" name="Final salary" radius={[8, 8, 0, 0]} fill="#0b5ed7" />
                    <Bar dataKey="lossOfPay" name="Loss of pay" radius={[8, 8, 0, 0]} fill="#b42318" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="dashboard-list">
              <div className="activity-row">
                <div>
                  <strong>Total salary</strong>
                  <span>Across generated payroll records</span>
                </div>
                <span className="pill pill-blue">
                  {analytics.payrollSummary.totalSalary || 0}
                </span>
              </div>
              <div className="activity-row">
                <div>
                  <strong>Average salary</strong>
                  <span>Mean final salary</span>
                </div>
                <span className="pill pill-green">
                  {formatTwoDecimals(analytics.payrollSummary.averageSalary || 0)}
                </span>
              </div>
              <div className="activity-row">
                <div>
                  <strong>Loss of pay</strong>
                  <span>Total deduction impact</span>
                </div>
                <span className="pill pill-red">
                  {analytics.payrollSummary.totalLossOfPay || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="list-card">
            <h3>Ticket status</h3>
            <div className="dashboard-list">
              {ticketStatusEntries.map(([label, value]) => (
                <div className="activity-row" key={label}>
                  <div>
                    <strong>{formatStatusLabel(label)}</strong>
                    <span>Support ticket volume</span>
                  </div>
                  <span className="pill pill-neutral">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Analytics;

function formatStatusLabel(value) {
  return String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTwoDecimals(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "0.00";

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
