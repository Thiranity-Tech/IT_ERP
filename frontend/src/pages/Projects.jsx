import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageProjects } from "../constants/roles";

function Projects() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditProjects = canManageProjects(roleId);

  useEffect(() => {
    api.get("/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete ${project.name}?`)) {
      return;
    }

    try {
      await api.delete(`/projects/${project.id}`);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      alert("Project deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete project");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Projects</h1>
          <p className="subtle">Project pipeline, lifecycle status, and deadlines.</p>
        </div>
        {canEditProjects && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => navigate("/create-project")}>
              Create Project
            </button>
          </div>
        )}
      </div>

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Department</th>
              <th>Client</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Tasks</th>
              <th>Status</th>
              {canEditProjects && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <span className="table-subtext">PRJ-{String(p.id).padStart(4, "0")}</span>
                </td>
                <td>{p.department?.name || "-"}</td>
                <td>{p.clientName}</td>
                <td>
                  <span className={`pill ${priorityClass(p.priority)}`}>{p.priority}</span>
                </td>
                <td>{new Date(p.deadline).toLocaleDateString()}</td>
                <td>{p._count?.tasks || 0}</td>
                <td>
                  <span className={`pill ${statusClass(p.status)}`}>{formatStatus(p.status)}</span>
                </td>
                {canEditProjects && (
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/edit-project/${p.id}`)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(p)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function priorityClass(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized.includes("HIGH")) return "pill-red";
  if (normalized.includes("MED")) return "pill-yellow";
  return "pill-neutral";
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("COMP")) return "pill-green";
  if (normalized.includes("ACT") || normalized.includes("PROG")) return "pill-blue";
  if (normalized.includes("PEND")) return "pill-yellow";
  return "pill-neutral";
}

function formatStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "IN_PROGRESS") return "In progress";
  if (normalized === "ACTIVE") return "Active";
  if (normalized === "COMPLETED") return "Completed";
  if (normalized === "PENDING") return "Pending";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default Projects;
