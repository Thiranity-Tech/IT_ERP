import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadTask = async () => {
      const res = await api.get(`/tasks/${id}`);
      setTitle(res.data.title);
      setDescription(res.data.description || "");
      setStatus(res.data.status);
      setDeadline(res.data.deadline?.split("T")[0] || "");
      setProjectId(String(res.data.projectId || ""));
      setUserId(String(res.data.userId || ""));
    };

    const loadLists = async () => {
      const [projectsRes, usersRes] = await Promise.all([api.get("/projects"), api.get("/users")]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    };

    void loadTask();
    void loadLists();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/tasks/${id}`, {
        title,
        description,
        status,
        deadline,
        projectId,
        userId,
      });

      alert("Task updated successfully");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to update task");
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Task entry</span>
            <h1>Edit Task</h1>
            <p>Update the task title, owner, project, due date, and completion status in one place.</p>
          </div>
          <div className="hero-note">Workspace task</div>
        </section>

        <section className="workspace-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Tasks</span>
              <h3>Edit details</h3>
              <p>Keep the task aligned with its project and assignee before saving the change.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="field">
                <span>Title</span>
                <input
                  type="text"
                  placeholder="Task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Deadline</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                placeholder="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label className="field">
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label className="field">
                <span>Project</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Assigned User</span>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="lookup-helper">
              If the task is already in progress, keep the project and owner in sync before marking it completed.
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/tasks")}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Update Task
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default EditTask;
