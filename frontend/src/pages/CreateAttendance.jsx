import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function CreateAttendance() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [date, setDate] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    void fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/attendance", {
        date,
        checkIn,
        checkOut,
        userId: Number(userId)
      });

      alert("Attendance created successfully");
      navigate("/attendance");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create attendance");
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Attendance entry</span>
            <h1>Create Attendance</h1>
            <p>Manually record a daily attendance entry for a user. Late and overtime can still be captured here if needed.</p>
          </div>
          <div className="hero-note">Manual entry</div>
        </section>

        <section className="workspace-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Attendance</span>
              <h3>New record</h3>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="field">
                <span>Employee</span>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                  <option value="">Select employee</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.employeeId} - {u.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span>Check In</span>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Check Out</span>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </label>
            </div>

            <div className="empty-state">
              Late arrival and overtime are calculated automatically from the Admin attendance timing settings.
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/attendance")}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Create Attendance
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default CreateAttendance;
