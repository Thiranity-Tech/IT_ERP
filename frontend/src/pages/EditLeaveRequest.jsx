// src/pages/EditLeaveRequest.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function EditLeaveRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        const res = await api.get(`/leave-requests/${id}`);

        setLeaveType(res.data.leaveType);
        setReason(res.data.reason);
        setStartDate(res.data.startDate?.split("T")[0] || "");
        setEndDate(res.data.endDate?.split("T")[0] || "");
      } catch (err) {
        console.error(err);
        alert("Failed to load leave request");
      }
    };

    fetchLeaveRequest();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/leave-requests/${id}`, {
        leaveType,
        reason,
        startDate,
        endDate,
      });

      alert("Leave request updated successfully");
      navigate("/leave-requests");
    } catch (err) {
      console.error(err);
      alert("Failed to update leave request");
    }
  };

  return (
    <Layout>
      <h1>Edit Leave Request</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Leave Type"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          required
        />

        <br /><br />

        <textarea
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <br /><br />

        <label>Start Date</label>
        <br />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />

        <br /><br />

        <label>End Date</label>
        <br />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">
          Update Leave Request
        </button>
      </form>
    </Layout>
  );
}

export default EditLeaveRequest;
