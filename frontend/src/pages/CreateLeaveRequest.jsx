import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { canSubmitLeave } from "../constants/roles";

function CreateLeaveRequest() {
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);

  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/leave-requests", {
        leaveType,
        reason,
        startDate,
        endDate,
      });

      alert("Leave request created successfully");
      navigate("/leave-requests");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create leave request");
    }
  };

  if (!canSubmitLeave(roleId)) {
    return (
      <Layout>
        <div className="empty-state">Leave requests are not available for Super Admin.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <h1>Create Leave Request</h1>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Leave Type</span>
            <input
              type="text"
              placeholder="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Reason</span>
            <textarea
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/leave-requests")} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Create Leave Request
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateLeaveRequest;
