import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import {
  DEFAULT_ROLES,
  roleRequiresDepartment,
  roleRequiresTeam
} from "../constants/roles";

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState("");
  const [roleId, setRoleId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then((res) => {
        setName(res.data.name || "");
        setEmail(res.data.email || "");
        setPhone(res.data.phone || "");
        setDesignation(res.data.designation || "");
        setSalary(res.data.salary ?? "");
        setRoleId(res.data.roleId || "");
        setTeamId(res.data.teamId || "");
        setDepartmentId(res.data.departmentId || "");
      })
      .catch((err) => console.error(err));

    api
      .get("/roles")
      .then((res) => {
        if (res.data?.length) setRoles(res.data);
      })
      .catch((err) => console.error(err));

    api
      .get("/teams")
      .then((res) => setTeams(res.data))
      .catch((err) => console.error(err));

    api
      .get("/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const teamRequired = roleRequiresTeam(roleId);
  const departmentRequired = roleRequiresDepartment(roleId);

  const handleRoleChange = (value) => {
    setRoleId(value);
    if (!roleRequiresTeam(value)) {
      setTeamId("");
    }
    if (!roleRequiresDepartment(value)) {
      setDepartmentId("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/users/${id}`, {
        name,
        email,
        phone,
        designation,
        salary,
        roleId,
        teamId: teamRequired ? teamId : null,
        departmentId: departmentRequired ? departmentId : null,
      });

      alert("User updated successfully");

      navigate("/users");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update user"
      );
    }
  };

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <h1>Edit User</h1>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          </label>

          <label className="field">
            <span>Email</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Designation</span>
            <input
              type="text"
              placeholder="Software Engineer"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Monthly Salary</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="50000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select
            value={roleId}
              onChange={(e) => handleRoleChange(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {teamRequired && (
            <label className="field">
              <span>Team</span>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.department?.name ? `${team.department.name} - ${team.name}` : team.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Department{departmentRequired ? "" : " (required only for Manager)"}</span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required={departmentRequired}
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
            <button className="btn btn-secondary" onClick={() => navigate("/users")} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Update User
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default EditUser;
