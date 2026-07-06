import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { canManageTeams } from "../constants/roles";

function CreateTeam() {
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditTeams = canManageTeams(roleId);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/teams", {
        name,
        departmentId,
      });

      alert("Team created successfully");
      navigate("/teams");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create team");
    }
  };

  if (!canEditTeams) {
    return (
      <Layout>
        <div className="empty-state">You do not have permission to create teams.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <h1>Create Team</h1>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Team Name</span>
            <input
              type="text"
              placeholder="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/teams")} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Create Team
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateTeam;
