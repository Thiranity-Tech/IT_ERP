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
  const [lateMinutes, setLateMinutes] = useState(0);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
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

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/attendance", {
        date,
        checkIn,
        checkOut,
        lateMinutes: Number(lateMinutes),
        overtimeMinutes: Number(overtimeMinutes),
        userId: Number(userId),
      });

      alert("Attendance created successfully");
      navigate("/attendance");
    } catch (err) {
      console.error(err);
      alert("Failed to create attendance");
    }
  };

  return (
    <Layout>
      <h1>Create Attendance</h1>

      <form onSubmit={handleSubmit}>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          <option value="">Select Employee</option>

          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.employeeId} - {u.name}
            </option>
          ))}
        </select>

        <br /><br />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <br /><br />

        <label>Check In</label>
        <br />

        <input
          type="datetime-local"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />

        <br /><br />

        <label>Check Out</label>
        <br />

        <input
          type="datetime-local"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />

        <br /><br />

        <input
          type="number"
          placeholder="Late Minutes"
          value={lateMinutes}
          onChange={(e) => setLateMinutes(e.target.value)}
        />

        <br /><br />

        <input
          type="number"
          placeholder="Overtime Minutes"
          value={overtimeMinutes}
          onChange={(e) => setOvertimeMinutes(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Create Attendance
        </button>
      </form>
    </Layout>
  );
}

export default CreateAttendance;
