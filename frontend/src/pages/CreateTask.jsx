import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function CreateTask() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data));
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/tasks", {
        title,
        description,
        status,
        deadline,
        projectId,
        userId,
      });

      alert("Task created successfully");

      navigate("/tasks");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to create task");
    }
  };

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="hero-note">Task entry</span>
            <h1>Create Task</h1>
            <p>Add a task to a project and assign it to the right employee with a due date and status.</p>
          </div>
          <div className="hero-note">Workspace task</div>
        </section>

        <section className="workspace-card">
          <div className="card-header">
            <div>
              <span className="card-kicker">Tasks</span>
              <h3>New task</h3>
              <p>Every task should clearly show the project, owner, and completion path.</p>
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
              Use a short title and assign the task to one project owner so the workflow stays clear.
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/tasks")}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Create Task
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default CreateTask;
