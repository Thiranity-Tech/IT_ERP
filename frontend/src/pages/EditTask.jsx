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
    api.get(`/tasks/${id}`).then((res) => {
      setTitle(res.data.title);
      setDescription(res.data.description || "");
      setStatus(res.data.status);
      setDeadline(
        res.data.deadline.split("T")[0]
      );
      setProjectId(res.data.projectId);
      setUserId(res.data.userId);
    });

    api.get("/projects").then((res) =>
      setProjects(res.data)
    );

    api.get("/users").then((res) =>
      setUsers(res.data)
    );
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
      alert("Failed to update task");
    }
  };

  return (
    <Layout>
      <h1>Edit Task</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
        />

        <br /><br />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <br /><br />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">
            In Progress
          </option>
          <option value="Completed">
            Completed
          </option>
        </select>

        <br /><br />

        <input
          type="date"
          value={deadline}
          onChange={(e) =>
            setDeadline(e.target.value)
          }
          required
        />

        <br /><br />

        <select
          value={projectId}
          onChange={(e) =>
            setProjectId(e.target.value)
          }
        >
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>

        <br /><br />

        <select
          value={userId}
          onChange={(e) =>
            setUserId(e.target.value)
          }
        >
          {users.map((user) => (
            <option
              key={user.id}
              value={user.id}
            >
              {user.name}
            </option>
          ))}
        </select>

        <br /><br />

        <button type="submit">
          Update Task
        </button>
      </form>
    </Layout>
  );
}

export default EditTask;