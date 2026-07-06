import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import {
  canApproveLeaveFor,
  canSubmitLeave
} from "../constants/roles";

function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId"));
  const currentUserId = Number(localStorage.getItem("userId"));
  const canCreateLeave = canSubmitLeave(roleId);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.get("/leave-requests");
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLeaves();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchLeaves]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/leave-requests/${id}/status`, {
        status,
      });

      await fetchLeaves();
      alert(`Leave ${status}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Status update failed");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Leave Requests</h1>
          <p className="subtle">Employee leave requests and approvals.</p>
        </div>
        {canCreateLeave && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => navigate("/create-leave-request")}>
              Create Leave Request
            </button>
          </div>
        )}
      </div>

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((leave) => {
              const canApproveThisLeave =
                leave.status === "PENDING" &&
                canApproveLeaveFor(roleId, leave.user?.roleId, currentUserId, leave.user?.id);

              return (
                <tr key={leave.id}>
                  <td>{leave.id}</td>
                  <td>{leave.user?.name}</td>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`pill ${statusClass(leave.status)}`}>{formatLeaveStatus(leave.status)}</span>
                  </td>
                  <td>
                    <div className="actions">
                      {canApproveThisLeave && (
                        <>
                          <button className="btn btn-success" type="button" onClick={() => updateStatus(leave.id, "APPROVED")}>
                            Approve
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => updateStatus(leave.id, "REJECTED")}>
                            Reject
                          </button>
                        </>
                      )}
                      {!canApproveThisLeave && <span className="table-subtext">View only</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("APPRO")) return "pill-green";
  if (normalized.includes("REJ")) return "pill-red";
  return "pill-yellow";
}

function formatLeaveStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "PENDING") return "Pending";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default LeaveRequests;
