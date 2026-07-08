import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

function EmployeeAnalytics() {
  const initialEmployeeId = localStorage.getItem("employeeId") || "";
  const [query, setQuery] = useState(initialEmployeeId);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (employeeId, employeeFallback = null) => {
    const trimmed = String(employeeId || "").trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      const res = await api.get(`/analytics/employee/${encodeURIComponent(trimmed)}`);
      setAnalytics(res.data);
      setSelectedEmployee({
        ...employeeFallback,
        ...(res.data?.employee || {})
      });
      setError("");
    } catch (err) {
      console.error(err);
      setAnalytics(null);
      setError(err.response?.data?.error || "Failed to load employee analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchEmployees = useCallback(async (value) => {
    const trimmed = String(value || "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
      setError(err.response?.data?.error || "Failed to search employees");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loadAnalytics(query, selectedEmployee);
    setResults([]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchEmployees(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, searchEmployees]);

  useEffect(() => {
    if (!initialEmployeeId) return undefined;

    const timer = setTimeout(() => {
      void loadAnalytics(initialEmployeeId);
    }, 0);

    return () => clearTimeout(timer);
  }, [initialEmployeeId, loadAnalytics]);

  const contactLabel = selectedEmployee?.phone || analytics?.employee?.phone || "No phone";
  const emailLabel = selectedEmployee?.email || analytics?.employee?.email || "No email";
  const nameLabel = selectedEmployee?.name || analytics?.employee?.name || "-";
  const idLabel = selectedEmployee?.employeeId || analytics?.employee?.employeeId || "-";

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Employee lookup</span>
            <h1>Employee Lookup</h1>
            <p>Search by employee ID, name, email, phone, or designation and review the employee summary in one view.</p>
          </div>
          <div className="hero-note">Super Admin view</div>
        </section>

        <section className="workspace-card lookup-search-panel">
          <div className="card-header">
            <div>
              <span className="card-kicker">Search</span>
              <h3>Find an employee</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Search employee</span>
              <input
                type="text"
                placeholder="Employee ID, name, email, phone, or designation"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError("");
                }}
              />
              <span className="lookup-helper">Type at least 2 characters to see matching employees.</span>
            </label>

            <div className="lookup-search-actions">
              <button className="btn btn-secondary" type="button" onClick={() => { setQuery(""); setResults([]); setSelectedEmployee(null); setAnalytics(null); setError(""); }}>
                Clear search
              </button>
              <button className="btn btn-primary" disabled={loading} type="submit">
                {loading ? "Loading..." : "Search employee"}
              </button>
            </div>
          </form>

          {query.trim().length >= 2 && (
            <div className="lookup-results">
              {searching ? (
                <div className="empty-state">Searching employees...</div>
              ) : results.length ? (
                <div className="lookup-results-grid">
                  {results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="lookup-result-card"
                      onClick={() => {
                        setQuery(user.employeeId || "");
                        setSelectedEmployee(user);
                        setResults([]);
                        void loadAnalytics(user.employeeId || "", user);
                      }}
                    >
                      <div className="lookup-result-title">
                        <span>{user.name || "-"}</span>
                        <span className="pill pill-neutral">{user.employeeId || "-"}</span>
                      </div>
                      <div className="lookup-result-subtitle">
                        {[user.designation, user.email, user.phone].filter(Boolean).join(" | ") || "No contact details stored"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">{error}</div>
              ) : (
                <div className="empty-state">No matching employees found.</div>
              )}
            </div>
          )}
        </section>

        {loading && !analytics ? (
          <div className="empty-state">Loading employee analytics...</div>
        ) : analytics ? (
          <>
            <section className="lookup-summary-grid">
              <StatCard label="Employee" value={nameLabel} hint={idLabel} />
              <StatCard label="Contact" value={contactLabel} hint={emailLabel} valueClassName="nowrap-value" />
              <StatCard label="Role" value={analytics.employee?.role || "-"} hint={selectedEmployee?.designation || analytics.employee?.designation || "No designation"} />
              <StatCard label="Base salary" value={formatMoney(analytics.employee?.salary)} hint={analytics.employee?.department || "-"} />
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <div className="lookup-card-header">
                  <div>
                    <h3>Profile</h3>
                    <p>Contact and assignment details</p>
                  </div>
                </div>
                <div className="dashboard-list">
                  <InfoRow label="Employee ID" value={analytics.employee?.employeeId || "-"} />
                  <InfoRow label="Name" value={analytics.employee?.name || "-"} />
                  <InfoRow label="Role" value={analytics.employee?.role || "-"} />
                  {analytics.employee?.email ? <InfoRow label="Email" value={analytics.employee.email} /> : null}
                  {analytics.employee?.phone ? <InfoRow label="Phone" value={analytics.employee.phone} valueClassName="nowrap-value" /> : null}
                  {analytics.employee?.designation ? <InfoRow label="Designation" value={analytics.employee.designation} /> : null}
                  {analytics.employee?.department ? <InfoRow label="Department" value={analytics.employee.department} /> : null}
                  {analytics.employee?.team ? <InfoRow label="Team" value={analytics.employee.team} /> : null}
                </div>
              </div>

              <div className="workspace-card">
                <div className="lookup-card-header">
                  <div>
                    <h3>Attendance</h3>
                    <p>Current year summary</p>
                  </div>
                </div>
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
                <div className="lookup-card-header">
                  <div>
                    <h3>Leave</h3>
                    <p>Requests logged for this employee</p>
                  </div>
                </div>
                <div className="dashboard-list">
                  <InfoRow label="Total requests" value={analytics.leaves?.total || 0} />
                  <InfoRow label="Approved" value={analytics.leaves?.approved || 0} />
                  <InfoRow label="Pending" value={analytics.leaves?.pending || 0} />
                  <InfoRow label="Leave days" value={analytics.leaves?.totalDays || 0} />
                </div>
              </div>

              <div className="workspace-card">
                <div className="lookup-card-header">
                  <div>
                    <h3>Payroll</h3>
                    <p>Stored payroll totals</p>
                  </div>
                </div>
                <div className="dashboard-list">
                  <InfoRow label="Records" value={analytics.payroll?.records || 0} />
                  <InfoRow label="Total salary" value={formatMoney(analytics.payroll?.totalSalary)} />
                  <InfoRow label="Latest salary" value={formatMoney(analytics.payroll?.latestSalary)} />
                  <InfoRow label="Base salary" value={formatMoney(analytics.employee?.salary)} />
                </div>
              </div>
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <div className="lookup-card-header">
                  <div>
                    <h3>Tasks</h3>
                    <p>Assigned and completed tasks</p>
                  </div>
                </div>
                <div className="dashboard-list">
                  <InfoRow label="Total" value={analytics.tasks?.total || 0} />
                  <InfoRow label="Completed" value={analytics.tasks?.completed || 0} />
                  <InfoRow label="Pending" value={analytics.tasks?.pending || 0} />
                  <InfoRow label="Archived" value={analytics.tasks?.archived || 0} />
                </div>
              </div>

              <div className="workspace-card">
                <div className="lookup-card-header">
                  <div>
                    <h3>Support Tickets</h3>
                    <p>Tickets linked to this employee</p>
                  </div>
                </div>
                <div className="dashboard-list">
                  <InfoRow label="Total" value={analytics.tickets?.total || 0} />
                  <InfoRow label="Approved" value={analytics.tickets?.approved || 0} />
                  <InfoRow label="In progress" value={analytics.tickets?.in_progress || 0} />
                  <InfoRow label="Closed" value={analytics.tickets?.closed || 0} />
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">Enter an employee ID, name, email, phone, or designation to load their analytics.</div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, hint, valueClassName = "" }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={`value ${valueClassName}`.trim()}>{value}</div>
      <div className="hint">{hint}</div>
    </div>
  );
}

function InfoRow({ label, value, valueClassName = "" }) {
  return (
    <div className="activity-row">
      <div>
        <strong>{label}</strong>
      </div>
      <span className={`pill pill-blue ${valueClassName}`.trim()}>{value}</span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export default EmployeeAnalytics;
