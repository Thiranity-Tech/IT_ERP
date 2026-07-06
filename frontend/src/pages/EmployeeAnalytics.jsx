import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function EmployeeAnalytics() {
  const initialEmployeeId = localStorage.getItem("employeeId") || "";
  const [employeeId, setEmployeeId] = useState(() => initialEmployeeId);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = useCallback(async (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/analytics/employee/${encodeURIComponent(trimmed)}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      setAnalytics(null);
      alert(err.response?.data?.error || "Failed to load employee analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadAnalytics(employeeId);
  };

  useEffect(() => {
    if (!initialEmployeeId) return undefined;

    const timer = setTimeout(() => {
      void loadAnalytics(initialEmployeeId);
    }, 0);

    return () => clearTimeout(timer);
  }, [initialEmployeeId, loadAnalytics]);

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Employee lookup</span>
            <h1>Employee Lookup</h1>
            <p>Look up one employee ID and review their attendance, leaves, payroll, tasks, tickets, and archives.</p>
          </div>
          <div className="hero-note">Scoped access</div>
        </section>

        <section className="workspace-card">
          <form className="form-grid" onSubmit={handleSearch}>
            <label className="field">
              <span>Employee ID</span>
              <input
                type="text"
                placeholder="EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" disabled={loading} type="submit">
                {loading ? "Searching..." : "Load Analytics"}
              </button>
            </div>
          </form>
        </section>

        {loading && !analytics ? (
          <div className="empty-state">Loading employee analytics...</div>
        ) : analytics ? (
          <>
            <section className="stats-grid">
              <StatCard label="Employee" value={analytics.employee?.name || "-"} hint={analytics.employee?.employeeId || "-"} />
              <StatCard label="Attendance" value={`${analytics.attendance?.records || 0}`} hint={`${analytics.attendance?.lateArrivals || 0} late, ${analytics.attendance?.overtimeEntries || 0} overtime`} />
              <StatCard label="Leaves" value={`${analytics.leaves?.total || 0}`} hint={`${analytics.leaves?.approved || 0} approved`} />
              <StatCard label="Payroll" value={`${analytics.payroll?.records || 0}`} hint={`${analytics.payroll?.latestMonth || "No payroll"}`} />
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <h3>Profile</h3>
                <div className="dashboard-list">
                  <InfoRow label="Role" value={analytics.employee?.role || "-"} />
                  <InfoRow label="Department" value={analytics.employee?.department || "-"} />
                  <InfoRow label="Team" value={analytics.employee?.team || "-"} />
                </div>
              </div>

              <div className="workspace-card">
                <h3>Attendance</h3>
                <div className="dashboard-list">
                  <InfoRow label="Records" value={analytics.attendance?.records || 0} />
                  <InfoRow label="Present" value={analytics.attendance?.present || 0} />
                  <InfoRow label="Late minutes" value={analytics.attendance?.totalLateMinutes || 0} />
                  <InfoRow label="Overtime hours" value={analytics.attendance?.totalOvertimeHours || 0} />
                </div>
              </div>
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <h3>Leave</h3>
                <div className="dashboard-list">
                  <InfoRow label="Total requests" value={analytics.leaves?.total || 0} />
                  <InfoRow label="Approved" value={analytics.leaves?.approved || 0} />
                  <InfoRow label="Pending" value={analytics.leaves?.pending || 0} />
                  <InfoRow label="Leave days" value={analytics.leaves?.totalDays || 0} />
                </div>
              </div>

              <div className="workspace-card">
                <h3>Payroll</h3>
                <div className="dashboard-list">
                  <InfoRow label="Records" value={analytics.payroll?.records || 0} />
                  <InfoRow label="Total salary" value={analytics.payroll?.totalSalary || 0} />
                  <InfoRow label="Latest salary" value={analytics.payroll?.latestSalary || 0} />
                  <InfoRow label="Projects" value={analytics.tasks?.projectCount || 0} />
                </div>
              </div>
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <h3>Tasks</h3>
                <div className="dashboard-list">
                  <InfoRow label="Total" value={analytics.tasks?.total || 0} />
                  <InfoRow label="Completed" value={analytics.tasks?.completed || 0} />
                  <InfoRow label="Pending" value={analytics.tasks?.pending || 0} />
                  <InfoRow label="Archived" value={analytics.tasks?.archived || 0} />
                </div>
              </div>

              <div className="workspace-card">
                <h3>Support Tickets</h3>
                <div className="dashboard-list">
                  <InfoRow label="Total" value={analytics.tickets?.total || 0} />
                  <InfoRow label="Approved" value={analytics.tickets?.approved || 0} />
                  <InfoRow label="In progress" value={analytics.tickets?.in_progress || 0} />
                  <InfoRow label="Closed" value={analytics.tickets?.closed || 0} />
                </div>
              </div>
            </section>

            <section className="workspace-card">
              <h3>Records Folder</h3>
              <div className="dashboard-list">
                <InfoRow label="Employee folder" value={analytics.archives?.employeeFolder || "-"} />
                <InfoRow label="Task folder" value={analytics.archives?.taskFolder || "-"} />
                <InfoRow label="Task archive" value={analytics.archives?.taskArchiveCount || 0} />
                <InfoRow label="Last assigned" value={formatDateTime(analytics.tasks?.lastAssignedAt)} />
                <InfoRow label="Last completed" value={formatDateTime(analytics.tasks?.lastCompletedAt)} />
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            Enter an employee ID to load their analytics.
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="hint">{hint}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="activity-row">
      <div>
        <strong>{label}</strong>
      </div>
      <span className="pill pill-blue">{value}</span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default EmployeeAnalytics;
