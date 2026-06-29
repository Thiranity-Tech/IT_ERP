import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);

        setName(res.data.name);
        setClientName(res.data.clientName);
        setDescription(res.data.description || "");
        setStartDate(res.data.startDate.split("T")[0]);
        setDeadline(res.data.deadline.split("T")[0]);
        setPriority(res.data.priority);
        setStatus(res.data.status);
        setDepartmentId(res.data.departmentId || "");
      } catch (err) {
        console.error(err);
        alert("Failed to load project");
      }
    };

    fetchProject();
    api
      .get("/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/projects/${id}`, {
        name,
        clientName,
        description,
        startDate,
        deadline,
        priority,
        status,
        departmentId,
      });

      alert("Project updated successfully");
      navigate("/projects");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update project");
    }
  };

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <h1>Edit Project</h1>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Project Name</span>
            <input
              type="text"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Client</span>
            <input
              type="text"
              placeholder="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Department</span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <span>Deadline</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            >
              <option value="">Select Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/projects")} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Update Project
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default EditProject;
