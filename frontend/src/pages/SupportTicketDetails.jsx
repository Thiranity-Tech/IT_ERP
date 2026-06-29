import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { ROLES } from "../constants/roles";

function SupportTicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const currentUserId = Number(localStorage.getItem("userId") || 0);
  const departmentName = (localStorage.getItem("departmentName") || localStorage.getItem("teamName") || "").trim();
  const isCrmDepartment = departmentName.toUpperCase() === "CRM";
  const canManageTicket = isCrmDepartment;
  const canApproveTicket = roleId >= ROLES.MANAGER && isCrmDepartment;
  const [ticket, setTicket] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get(`/support-tickets/${id}/notes`);
      setNotes(res.data || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  }, [id]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get(`/support-tickets/${id}/events`);
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  }, [id]);

  useEffect(() => {
    api
      .get(`/support-tickets/${id}`)
      .then((res) => setTicket(res.data))
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to load support ticket");
        navigate("/support-tickets");
      });
  }, [id, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotes();
      void fetchEvents();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchEvents, fetchNotes]);

  const refreshTicket = async () => {
    const res = await api.get(`/support-tickets/${id}`);
    setTicket(res.data);
  };

  const updateStatus = async (status) => {
    const payload = { status };

    if (status === "REJECTED") {
      const rejectionReason = window.prompt("Rejection reason");
      if (!rejectionReason) return;
      payload.rejectionReason = rejectionReason;
    }

    try {
      await api.put(`/support-tickets/${id}`, payload);
      await refreshTicket();
      await fetchEvents();
      alert("Support ticket updated");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update support ticket");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this support ticket?")) return;

    try {
      await api.delete(`/support-tickets/${id}`);
      navigate("/support-tickets");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete ticket");
    }
  };

  const status = String(ticket?.status || "").toUpperCase();
  const canStartWork = ["APPROVED", "ASSIGNED", "WORKING", "WAITING", "TESTING"].includes(status);
  const canComplete = status === "IN_PROGRESS";

  const saveNote = async () => {
    const content = noteText.trim();
    if (!content) return;

    try {
      await api.post(`/support-tickets/${id}/notes`, {
        note: content
      });
      setNoteText("");
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save note");
    }
  };

  const removeNote = async (noteId) => {
    try {
      await api.delete(`/support-tickets/notes/${noteId}`);
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete note");
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <div className="table-toolbar">
          <div>
            <h1>Support Ticket</h1>
            <p className="subtle">Use this screen to move the ticket through approval, progress, and completion.</p>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={() => navigate("/support-tickets")}>
              Back
            </button>
          </div>
        </div>

        {ticket ? (
          <>
            <section className="workspace-card">
              <div className="card-header">
                <div>
                  <span className="card-kicker">Ticket</span>
                  <h3>{ticket.title}</h3>
                </div>
                <span className={`pill ${ticketStatus(ticket.status)}`}>{formatTicketStatus(ticket.status)}</span>
              </div>
              <p className="subtle">{ticket.description || "No description provided."}</p>
            </section>

            <section className="section-grid">
              <div className="workspace-card">
                <h3>Details</h3>
                <div className="dashboard-list">
                  <InfoRow label="Client" value={ticket.client?.name || "-"} />
                  <InfoRow label="Priority" value={ticket.priority || "-"} />
                  <InfoRow label="Category" value={ticket.category || "-"} />
                  <InfoRow label="Source" value={ticket.sourceChannel || "-"} />
                  <InfoRow label="Assigned To" value={ticket.assignedTo?.name || "-"} />
                </div>
              </div>

              <div className="workspace-card">
                <h3>Workflow</h3>
                <div className="dashboard-list">
                  <InfoRow label="Submitted" value="CRM user creates the ticket" />
                  <InfoRow label="Approved" value="CRM manager reviews and accepts it" />
                  <InfoRow label="In Progress" value="Approved tickets move here when work starts" />
                  <InfoRow label="Completed" value="Close the ticket after delivery" />
                </div>
                <p className="subtle" style={{ marginTop: "12px" }}>
                  Approved tickets must be moved to In Progress before they can be completed.
                </p>
              </div>
            </section>

            <section className="workspace-card">
              <h3>Timeline</h3>
              <div className="dashboard-list">
                {["SUBMITTED_FOR_APPROVAL", "APPROVED", "IN_PROGRESS", "CLOSED"].map((step) => (
                  <div className="activity-row" key={step}>
                    <div>
                      <strong>{formatTicketStatus(step)}</strong>
                      <span>{timelineHint(step)}</span>
                    </div>
                    <span className={`pill ${statusTone(status, step)}`}>
                      {status === step ? "Current" : "Step"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <h3>Activity</h3>
              <div className="dashboard-list">
                {events.map((item) => (
                  <div className="activity-row" key={item.id}>
                    <div>
                      <strong>{formatEventTitle(item.action)}</strong>
                      <span>{item.detail || "Ticket activity"}</span>
                    </div>
                    <div className="actions">
                      <span className="pill pill-neutral">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {!events.length && <div className="empty-state">No activity yet.</div>}
              </div>
            </section>

            <section className="workspace-card">
              <h3>Notes</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Add note</span>
                  <textarea
                    rows="4"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a follow-up note or internal remark"
                  />
                </label>
                <div className="form-actions">
                  <button className="btn btn-primary" type="button" onClick={saveNote}>
                    Save Note
                  </button>
                </div>
              </div>
              <div className="dashboard-list" style={{ marginTop: "16px" }}>
                {notes.map((note) => (
                  <div className="activity-row" key={note.id}>
                    <div>
                      <strong>{note.user?.name || "Note"}</strong>
                      <span>{note.note}</span>
                    </div>
                    <div className="actions">
                      <span className="pill pill-blue">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                      {(currentUserId === Number(note.userId) || canManageTicket) && (
                        <button className="btn btn-secondary" type="button" onClick={() => removeNote(note.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <h3>Actions</h3>
              <div className="form-actions">
                {canManageTicket && status === "SUBMITTED_FOR_APPROVAL" && canApproveTicket && (
                  <>
                    <button className="btn btn-success" type="button" onClick={() => updateStatus("APPROVED")}>
                      Approve
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => updateStatus("REJECTED")}>
                      Reject
                    </button>
                  </>
                )}

                {canManageTicket && canStartWork && (
                  <button className="btn btn-primary" type="button" onClick={() => updateStatus("IN_PROGRESS")}>
                    Move to In Progress
                  </button>
                )}

                {canManageTicket && canComplete && (
                  <button className="btn btn-success" type="button" onClick={() => updateStatus("CLOSED")}>
                    Mark Completed
                  </button>
                )}

                {canManageTicket && !["RESOLVED", "CLOSED"].includes(status) && (
                  <button className="btn btn-danger" type="button" onClick={handleDelete}>
                    Delete Ticket
                  </button>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">Loading support ticket...</div>
        )}
      </div>
    </Layout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="activity-row">
      <div>
        <strong>{label}</strong>
      </div>
      <span className="pill pill-blue">{value}</span>
    </div>
  );
}

function ticketStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("CLOS") || normalized === "RESOLVED") return "pill-green";
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
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timelineHint(step) {
  if (step === "SUBMITTED_FOR_APPROVAL") return "Waiting for CRM manager approval";
  if (step === "APPROVED") return "Ready for work";
  if (step === "IN_PROGRESS") return "Being worked on";
  if (step === "CLOSED") return "Completed and archived";
  return "Workflow step";
}

function statusTone(current, step) {
  const normalizedCurrent = String(current || "").toUpperCase();
  if (normalizedCurrent === step) {
    if (step === "IN_PROGRESS") return "pill-blue";
    return "pill-green";
  }
  return "pill-neutral";
}

function formatEventTitle(action) {
  const normalized = String(action || "").trim().toUpperCase();
  if (normalized === "CREATED") return "Created";
  if (normalized === "STATUS_CHANGED") return "Status changed";
  if (normalized === "ASSIGNED") return "Assigned";
  if (normalized === "REJECTED") return "Rejected";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default SupportTicketDetails;
