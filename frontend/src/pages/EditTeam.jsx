import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { canManageTeams } from "../constants/roles";

function EditTeam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditTeams = canManageTeams(roleId);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/teams/${id}`), api.get("/departments")])
      .then(([teamRes, departmentRes]) => {
        setName(teamRes.data?.name || "");
        setDepartmentId(teamRes.data?.departmentId || "");
        setDepartments(departmentRes.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load team details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put(`/teams/${id}`, {
        name: name.trim(),
        departmentId,
      });
      alert("Team updated successfully");
      navigate("/teams");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  if (!canEditTeams) {
    return (
      <Layout>
        <div className="empty-state">You do not have permission to edit teams.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Team Settings</p>
            <h1>Edit Team</h1>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading team details...</div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            <label className="field">
              <span>Team Name</span>
              <input
                type="text"
                placeholder="Enter team name"
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
              <button className="btn btn-primary" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Team"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

export default EditTeam;
