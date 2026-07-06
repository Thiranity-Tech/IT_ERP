import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { canManageTasks } from "../constants/roles";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canManage = canManageTasks(roleId);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(sortTasks(res.data));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    api
      .get("/tasks")
      .then((res) => setTasks(sortTasks(res.data)))
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/tasks/${id}`);
      await fetchTasks();

      alert("Task deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Tasks</h1>
          <p className="subtle">Assigned work, deadlines, and execution status.</p>
        </div>
        {canManage && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => navigate("/create-task")}>
              Create Task
            </button>
          </div>
        )}
      </div>

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Project</th>
              <th>User</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td><span className={`pill ${statusClass(task.status)}`}>{formatTaskStatus(task.status)}</span></td>
                <td>{new Date(task.deadline).toLocaleDateString()}</td>
                <td>{task.project?.name}</td>
                <td>{task.user?.name}</td>
                {canManage && (
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary" onClick={() => navigate(`/edit-task/${task.id}`)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
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

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized.includes("COMP")) return "pill-green";
  if (normalized.includes("PROG")) return "pill-blue";
  if (normalized.includes("BLOCK")) return "pill-red";
  if (normalized.includes("PEND")) return "pill-yellow";
  return "pill-neutral";
}

function sortTasks(items) {
  return [...(items || [])].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
}

function formatTaskStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "COMPLETED") return "Completed";
  if (normalized === "IN_PROGRESS") return "In progress";
  if (normalized === "READY FOR TESTING") return "Ready for testing";
  if (normalized === "READY_FOR_TESTING") return "Ready for testing";
  if (normalized === "BLOCKED") return "Blocked";
  if (normalized === "PENDING") return "Pending";
  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default Tasks;
