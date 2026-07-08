import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { ROLES } from "../constants/roles";

function AttendanceSettings() {
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const isAdmin = roleId === ROLES.ADMIN;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [officeStart, setOfficeStart] = useState("09:00");
  const [officeEnd, setOfficeEnd] = useState("18:00");
  const [graceMinutes, setGraceMinutes] = useState("10");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/office-settings");
        setOfficeStart(res.data?.officeStart || "09:00");
        setOfficeEnd(res.data?.officeEnd || "18:00");
        setGraceMinutes(String(res.data?.graceMinutes ?? 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      await api.post("/api/office-settings", {
        officeStart,
        officeEnd,
        graceMinutes: Number(graceMinutes)
      });
      alert("Attendance timing saved successfully");
      navigate("/attendance");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to save attendance timing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Admin setting</span>
            <h1>Attendance Timing</h1>
            <p>Set the normal office in-time, out-time, and grace minutes used to calculate late arrival and overtime.</p>
          </div>
          <div className="hero-note">Admin only</div>
        </section>

        {!isAdmin ? (
          <section className="workspace-card">
            {loading ? (
              <div className="empty-state">Loading attendance timing...</div>
            ) : (
              <div className="form-grid">
                <div className="form-row">
                  <label className="field">
                    <span>Office start time</span>
                    <input type="time" value={officeStart} readOnly />
                  </label>

                  <label className="field">
                    <span>Office end time</span>
                    <input type="time" value={officeEnd} readOnly />
                  </label>

                  <label className="field">
                    <span>Grace minutes</span>
                    <input type="number" value={graceMinutes} readOnly />
                  </label>
                </div>

                <div className="empty-state">
                  Attendance timing is visible to Super Admin, but only Admin can edit it.
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="workspace-card">
            {loading ? (
              <div className="empty-state">Loading attendance timing...</div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label className="field">
                    <span>Office start time</span>
                    <input type="time" value={officeStart} onChange={(e) => setOfficeStart(e.target.value)} />
                  </label>

                  <label className="field">
                    <span>Office end time</span>
                    <input type="time" value={officeEnd} onChange={(e) => setOfficeEnd(e.target.value)} />
                  </label>

                  <label className="field">
                    <span>Grace minutes</span>
                    <input
                      min="0"
                      type="number"
                      value={graceMinutes}
                      onChange={(e) => setGraceMinutes(e.target.value)}
                    />
                  </label>
                </div>

                <div className="lookup-helper">
                  Late arrival is calculated after the grace period. Overtime starts after the office end time.
                </div>

                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => navigate("/attendance")} type="button">
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={saving} type="submit">
                    {saving ? "Saving..." : "Save Timing"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

export default AttendanceSettings;
