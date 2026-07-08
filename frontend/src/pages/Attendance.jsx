import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ROLES, canManageAttendance } from "../constants/roles";

function AttendanceReport() {
  const [report, setReport] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditAttendance = canManageAttendance(roleId);
  const canEditAttendanceTiming = roleId >= ROLES.ADMIN;

  useEffect(() => {
    api.get("/attendance/report")
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchReport = () => {
    api.get("/attendance/report")
      .then((res) => setReport(res.data))
      .catch((err) => console.error(err));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/attendance/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      fetchReport();
      setUploadSummary(res.data?.summary || null);
      alert(res.data?.message || "Attendance uploaded successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload attendance");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Attendance workspace</span>
            <h1>Attendance Report</h1>
            <p>Excel uploads and manual entries are both normalized against the same office timing rules.</p>
          </div>
          <div className="hero-note">Timing-based calculation</div>
        </section>

        {canEditAttendance && (
          <section className="workspace-card">
            <div className="card-header">
              <div>
                <span className="card-kicker">Import</span>
                <h3>Upload attendance sheet</h3>
                <p>Use the Excel template, then import the file to create attendance rows.</p>
              </div>
              <div className="actions">
                {canEditAttendanceTiming && (
                  <button className="btn btn-secondary" onClick={() => navigate("/attendance-settings")} type="button">
                    Timing settings
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => navigate("/create-attendance")} type="button">
                  Add manual entry
                </button>
              </div>
            </div>

            <form className="attendance-upload" onSubmit={handleUpload}>
              <label className="field">
                <span>Attendance file</span>
                <input
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  type="file"
                />
              </label>
              <button className="btn btn-primary" disabled={!file || uploading} type="submit">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>

            {uploadSummary && (
              <div className="metric-strip" style={{ marginTop: 16 }}>
                <span>Processed {uploadSummary.processed || 0}</span>
                <span>Saved {uploadSummary.saved || 0}</span>
                <span>Skipped {uploadSummary.skipped || 0}</span>
                <span>Missing ID {uploadSummary.skippedMissingEmployeeId || 0}</span>
                <span>Unknown employee {uploadSummary.skippedUnknownEmployee || 0}</span>
                <span>Out of scope {uploadSummary.skippedOutOfScope || 0}</span>
                <span>Bad date {uploadSummary.skippedInvalidDate || 0}</span>
                <span>Existing rows {uploadSummary.skippedExisting || 0}</span>
              </div>
            )}
          </section>
        )}

        <section className="workspace-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Records</span>
              <h3>Attendance rows</h3>
            </div>
            <span className="card-count">{report.length}</span>
          </div>

          <div className="table-panel">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Late Minutes</th>
                  <th>Overtime Minutes</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {report.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user.employeeId}</td>
                    <td>{item.user.name}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.lateMinutes}</td>
                    <td>{item.overtimeMinutes}</td>
                    <td>
                      <span className={`pill ${statusClass(item.status)}`}>{formatAttendanceStatus(item.status)}</span>
                    </td>
                  </tr>
                ))}
                {!report.length && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">No attendance rows found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("PRES")) return "pill-green";
  if (normalized.includes("ABS")) return "pill-red";
  return "pill-neutral";
}

function formatAttendanceStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "PRESENT") return "Present";
  if (normalized === "ABSENT") return "Absent";
  if (normalized === "HALF_DAY") return "Half day";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default AttendanceReport;
