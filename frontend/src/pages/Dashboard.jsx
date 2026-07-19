import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function Dashboard() {
  const [data, setData] = useState({
    totalEmployees: 0,
    totalProjects: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    openTickets: 0,
    totalPayrollRecords: 0,
    totalPayrollPaid: 0,
    recentProjects: [],
    recentLeaves: [],
    recentTickets: [],
    recentPayrolls: [],
  });

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="hero-note">Workspace overview</span>
            <h1>ERP Dashboard</h1>
          </div>
          <div className="dashboard-hero-rail">
            <strong>{data.totalEmployees} employees</strong>
            <small>
              {data.totalProjects} projects - {data.openTickets} open tickets
            </small>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="label">Employee count</div>
            <div className="value">{data.totalEmployees}</div>
            <div className="hint">Registered employee accounts</div>
          </div>
          <div className="stat-card">
            <div className="label">Project count</div>
            <div className="value">{data.totalProjects}</div>
            <div className="hint">All tracked projects</div>
          </div>
          <div className="stat-card">
            <div className="label">Active work</div>
            <div className="value">{data.activeProjects}</div>
            <div className="hint">Projects currently underway</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending leave</div>
            <div className="value">{data.pendingLeaves}</div>
            <div className="hint">Leaves awaiting approval</div>
          </div>
          <div className="stat-card">
            <div className="label">Payroll paid</div>
            <div className="value">{currency.format(data.totalPayrollPaid || 0)}</div>
            <div className="hint">{data.totalPayrollRecords || 0} payroll records</div>
          </div>
        </section>

        <section className="section-grid">
          <div className="workspace-card">
            <div className="card-header">
              <div>
                <span className="card-kicker">Workstream</span>
                <h3>Recent projects</h3>
              </div>
              <span className="card-count">{data.recentProjects.length}</span>
            </div>
            {data.recentProjects.length ? (
              <div className="dashboard-list">
                {data.recentProjects.map((project) => (
                  <div className="activity-row" key={project.id}>
                    <div className="row-copy">
                      <strong>{project.name}</strong>
                      <span>{project.clientName}</span>
                    </div>
                    <span className={`pill ${statusClass(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No projects found.</div>
            )}
          </div>

          <div className="workspace-card">
            <div className="card-header">
            <div>
              <span className="card-kicker">Snapshot</span>
              <h3>Operations snapshot</h3>
            </div>
          </div>
            <div className="dashboard-list">
              <div className="activity-row">
                <div className="row-copy">
                  <strong>Open support tickets</strong>
                  <span>Issues waiting for response</span>
                </div>
                <span className="pill pill-red">{data.openTickets}</span>
              </div>
              <div className="activity-row">
                <div className="row-copy">
                  <strong>Recent leaves</strong>
                  <span>Latest requests from employees</span>
                </div>
                <span className="pill pill-blue">{data.recentLeaves.length}</span>
              </div>
              <div className="activity-row">
                <div className="row-copy">
                  <strong>Recent tickets</strong>
                  <span>Fresh support activity</span>
                </div>
                <span className="pill pill-neutral">{data.recentTickets.length}</span>
              </div>
              <div className="activity-row">
                <div className="row-copy">
                  <strong>Payroll records</strong>
                  <span>Generated salary slips</span>
                </div>
                <span className="pill pill-green">{data.totalPayrollRecords}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="recent-grid">
          <div className="list-card">
            <div className="card-header">
              <div>
                <span className="card-kicker">People</span>
                <h3>Latest leaves</h3>
              </div>
              <span className="card-count">{data.recentLeaves.length}</span>
            </div>
            {data.recentLeaves.length ? (
              data.recentLeaves.map((leave) => (
                <div className="recent-item" key={leave.id}>
                  <div className="row-copy">
                    <strong>{leave.user?.name || "Employee"}</strong>
                    <span>{leave.leaveType}</span>
                  </div>
                  <span className={`pill ${statusClass(leave.status)}`}>
                    {formatStatus(leave.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No leave requests yet.</div>
            )}
          </div>

          <div className="list-card">
            <div className="card-header">
              <div>
                <span className="card-kicker">Support</span>
                <h3>Latest tickets</h3>
              </div>
              <span className="card-count">{data.recentTickets.length}</span>
            </div>
            {data.recentTickets.length ? (
              data.recentTickets.map((ticket) => (
                <div className="recent-item" key={ticket.id}>
                  <div className="row-copy">
                    <strong>{ticket.title}</strong>
                    <span>{ticket.client?.name || "Client"}</span>
                  </div>
                  <span className={`pill ${statusClass(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No tickets yet.</div>
            )}
          </div>

          <div className="list-card">
            <div className="card-header">
              <div>
                <span className="card-kicker">Finance</span>
                <h3>Latest payroll</h3>
              </div>
              <span className="card-count">{data.recentPayrolls.length}</span>
            </div>
            {data.recentPayrolls.length ? (
              data.recentPayrolls.map((payroll) => (
                <div className="recent-item" key={payroll.id}>
                  <div className="row-copy">
                    <strong>{payroll.user?.name || "Employee"}</strong>
                    <span>{formatMonth(payroll.month)}</span>
                  </div>
                  <span className="pill pill-green">
                    {currency.format(payroll.finalSalary || 0)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No payroll generated yet.</div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function formatStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  const labelMap = {
    APPROVED: "Approved",
    PENDING: "Pending",
    REJECTED: "Rejected",
    IN_PROGRESS: "In progress",
    INPROGRESS: "In progress",
    SUBMITTED_FOR_APPROVAL: "Submitted for approval",
    CLOSED: "Closed",
    OPEN: "Open",
  };

  if (labelMap[normalized]) {
    return labelMap[normalized];
  }

  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("APPROV") || normalized === "ACTIVE" || normalized === "CLOSED") {
    return "pill-green";
  }
  if (normalized.includes("PEND") || normalized === "OPEN") {
    return "pill-yellow";
  }
  if (normalized.includes("REJECT") || normalized === "OVERDUE") {
    return "pill-red";
  }
  return "pill-neutral";
}

function formatMonth(value) {
  if (!value) {
    return "Payroll month";
  }

  const [year, month] = String(value).split("-");
  if (!year || !month) {
    return value;
  }

  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export default Dashboard;
