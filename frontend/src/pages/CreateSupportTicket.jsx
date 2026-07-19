import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { ROLES } from "../constants/roles";

function CreateSupportTicket() {
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const departmentName = (
    localStorage.getItem("departmentName") ||
    localStorage.getItem("teamName") ||
    ""
  ).trim();
  const canCreateTicket =
    roleId >= ROLES.SUPER_ADMIN || departmentName.toUpperCase() === "CRM";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Support");
  const [sourceChannel, setSourceChannel] = useState("Portal");
  const [assignedToId, setAssignedToId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canCreateTicket) {
      return;
    }

    Promise.all([
      api.get("/clients"),
      api.get("/users"),
      api.get("/projects"),
    ])
      .then(([clientRes, userRes, projectRes]) => {
        setClients(clientRes.data || []);
        setUsers(userRes.data || []);
        setProjects(projectRes.data || []);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to load support ticket form data");
      });
  }, [canCreateTicket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/support-tickets", {
        title: title.trim(),
        description: description.trim(),
        clientId,
        priority,
        category,
        sourceChannel,
        assignedToId: assignedToId || null,
        projectId: projectId || null,
      });

      alert("Support ticket submitted for approval");
      navigate(`/support-tickets/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create support ticket");
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateTicket) {
    return (
      <Layout>
        <div className="empty-state">
          Only CRM department users can create support tickets.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">CRM ticket entry</span>
            <h1>Create Support Ticket</h1>
            <p>Record a client issue and submit it to the CRM manager for approval.</p>
          </div>
          <div className="hero-note">Submitted for approval</div>
        </section>

        <section className="workspace-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Support</span>
              <h3>New ticket</h3>
              <p className="subtle">
                CRM tickets start in approval and move to in progress only after manager review.
              </p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  placeholder="Short issue title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Client</span>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                placeholder="Describe the issue, client impact, and required action"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label className="field">
                <span>Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>

              <label className="field">
                <span>Category</span>
                <input
                  type="text"
                  placeholder="Support"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Source Channel</span>
                <select value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)}>
                  <option value="Portal">Portal</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Client Meeting">Client Meeting</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span>Assign To</span>
                <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                  <option value="">Assign later</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.employeeId ? `${user.employeeId} - ${user.name}` : user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Project</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">No linked project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="lookup-helper">
              After creation, the CRM manager can approve or reject the ticket.
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/support-tickets")}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={loading} type="submit">
                {loading ? "Submitting..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default CreateSupportTicket;
