// src/pages/EditAttendance.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function EditAttendance() {
  const { id } = useParams();
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

    const fetchAttendance = async () => {
      try {
        const res = await api.get(`/attendance/${id}`);

        setDate(res.data.date?.split("T")[0] || "");

        setCheckIn(
          res.data.checkIn
            ? new Date(res.data.checkIn)
                .toISOString()
                .slice(0, 16)
            : ""
        );

        setCheckOut(
          res.data.checkOut
            ? new Date(res.data.checkOut)
                .toISOString()
                .slice(0, 16)
            : ""
        );

        setLateMinutes(res.data.lateMinutes);
        setOvertimeMinutes(res.data.overtimeMinutes);
        setUserId(res.data.userId);
      } catch (err) {
        console.error(err);
        alert("Failed to load attendance");
      }
    };

    fetchUsers();
    fetchAttendance();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/attendance/${id}`, {
        date,
        checkIn,
        checkOut,
        lateMinutes: Number(lateMinutes),
        overtimeMinutes: Number(overtimeMinutes),
        userId: Number(userId),
      });

      alert("Attendance updated successfully");
      navigate("/attendance");
    } catch (err) {
      console.error(err);
      alert("Failed to update attendance");
    }
  };

  return (
    <Layout>
      <h1>Edit Attendance</h1>

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
          Update Attendance
        </button>
      </form>
    </Layout>
  );
}

export default EditAttendance;
