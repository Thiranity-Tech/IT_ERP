import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageAttendance } from "../constants/roles";

function AttendanceReport() {
  const [report, setReport] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditAttendance = canManageAttendance(roleId);

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
      await api.post("/attendance/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      fetchReport();
      alert("Attendance uploaded successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload attendance");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Attendance Report</h1>
          <p className="subtle">Attendance imported from Excel and calculated from office timing rules.</p>
        </div>
        {canEditAttendance && (
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => navigate("/create-attendance")} type="button">
              Manual Entry
            </button>
          </div>
        )}
      </div>

      {canEditAttendance && (
        <div className="panel attendance-import-panel">
          <form className="attendance-upload" onSubmit={handleUpload}>
            <label className="field">
              <span>Attendance Import</span>
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
        </div>
      )}

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
          </tbody>
        </table>
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
