import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { ROLES } from "../constants/roles";

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const departmentName = (localStorage.getItem("departmentName") || localStorage.getItem("teamName") || "").trim();
  const isCrmDepartment = departmentName.toUpperCase() === "CRM";
  const canApproveTickets = roleId >= ROLES.MANAGER && isCrmDepartment;
  const canEditTicket = isCrmDepartment;

  useEffect(() => {
    api.get("/support-tickets")
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err));
  }, []);

  const updateStatus = async (ticket, status) => {
    const payload = { status };

    if (status === "REJECTED") {
      const rejectionReason = window.prompt("Rejection reason");
      if (!rejectionReason) {
        return;
      }
      payload.rejectionReason = rejectionReason;
    }

    try {
      const res = await api.put(`/support-tickets/${ticket.id}`, payload);
      setTickets((current) =>
        current.map((item) =>
          item.id === ticket.id ? { ...item, ...res.data } : item
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update ticket");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Support Tickets</h1>
          <p className="subtle">CRM support requests and client issues.</p>
        </div>
      </div>

      <div className="recent-grid">
        {tickets.map((ticket) => (
          <div className="list-card" key={ticket.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/support-tickets/${ticket.id}`)}>
            <h3>{ticket.title}</h3>
            <div className="subtle">{ticket.description || "No description provided"}</div>
            <div className="metric-strip" style={{ marginTop: "12px" }}>
              <span className={`pill ${ticketStatus(ticket.status)}`}>{formatTicketStatus(ticket.status)}</span>
              {canEditTicket && (
                <>
                  <button className="btn btn-secondary" type="button" onClick={(e) => { e.stopPropagation(); navigate(`/support-tickets/${ticket.id}`); }}>
                    View
                  </button>
                  {canApproveTickets && String(ticket.status || "").toUpperCase() === "SUBMITTED_FOR_APPROVAL" && (
                    <>
                      <button className="btn btn-success" type="button" onClick={(e) => { e.stopPropagation(); updateStatus(ticket, "APPROVED"); }}>
                        Approve
                      </button>
                      <button className="btn btn-danger" type="button" onClick={(e) => { e.stopPropagation(); updateStatus(ticket, "REJECTED"); }}>
                        Reject
                      </button>
                    </>
                  )}
                  {["APPROVED", "ASSIGNED", "WORKING", "WAITING", "TESTING"].includes(String(ticket.status || "").toUpperCase()) && (
                    <button className="btn btn-primary" type="button" onClick={(e) => { e.stopPropagation(); updateStatus(ticket, "IN_PROGRESS"); }}>
                      Move to In Progress
                    </button>
                  )}
                  {String(ticket.status || "").toUpperCase() === "IN_PROGRESS" && (
                    <button className="btn btn-success" type="button" onClick={(e) => { e.stopPropagation(); updateStatus(ticket, "CLOSED"); }}>
                      Mark Completed
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {!tickets.length && <div className="empty-state">No support tickets found.</div>}
      </div>
    </Layout>
  );
}

function ticketStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("CLOS")) return "pill-green";
  if (normalized === "RESOLVED") return "pill-green";
  if (normalized.includes("PROG")) return "pill-blue";
  if (normalized.includes("APPROV")) return "pill-green";
  if (normalized.includes("REJECT")) return "pill-red";
  return "pill-yellow";
}

function formatTicketStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "SUBMITTED_FOR_APPROVAL") return "Submitted for approval";
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "IN_PROGRESS") return "In progress";
  if (normalized === "RESOLVED") return "Resolved";
  if (normalized === "CLOSED") return "Completed";
  if (normalized === "READY_FOR_DELIVERY") return "Ready for delivery";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default SupportTickets;
