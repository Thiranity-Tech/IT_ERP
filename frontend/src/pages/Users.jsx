import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageUsers, ROLES } from "../constants/roles";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function Users() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditUsers = canManageUsers(roleId);

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setUsers(sortUsers(res.data)))
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (user) => {
    if (!canEditUsers) {
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${user.id}`);
      setUsers((current) => current.filter((u) => u.id !== user.id));
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        const forceDelete = window.confirm(
          "This user has linked records. Delete the user and all linked records?"
        );

        if (!forceDelete) {
          alert(err.response?.data?.error || "Failed to delete user");
          return;
        }

        try {
          await api.delete(`/users/${user.id}?force=true`);
          setUsers((current) => current.filter((u) => u.id !== user.id));
          alert("User deleted successfully");
          return;
        } catch (forceErr) {
          console.error(forceErr);
          alert(forceErr.response?.data?.error || "Failed to force delete user");
          return;
        }
      }

      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Users</h1>
          <p className="subtle">Employee directory. Only the super admin can create, edit, or delete users.</p>
        </div>
        {canEditUsers && (
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/create-user")}
            >
              Create User
            </button>
          </div>
        )}
      </div>

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Team</th>
              <th>Base Salary</th>
              {canEditUsers && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {users.map((u, index) => (
              <tr key={u.id}>
                <td>{index + 1}</td>
                <td>{u.employeeId}</td>
                <td>{u.name}</td>
                <td>{formatRoleName(u.role?.name || u.roleId)}</td>
                <td>{u.designation || "-"}</td>
                <td>{u.department?.name || u.team?.department?.name || "-"}</td>
                <td>{u.team?.name || "-"}</td>
                <td>{u.salary ? currency.format(u.salary) : "-"}</td>
                {canEditUsers && (
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/edit-user/${u.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(u)}
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

function sortUsers(items) {
  const roleRank = {
    [ROLES.SUPER_ADMIN]: 0,
    [ROLES.ADMIN]: 1,
    [ROLES.MANAGER]: 2,
    [ROLES.TEAM_LEAD]: 3,
    [ROLES.USER]: 4,
  };

  return [...(items || [])].sort((a, b) => {
    const roleDelta =
      (roleRank[a.roleId] ?? Number.MAX_SAFE_INTEGER) -
      (roleRank[b.roleId] ?? Number.MAX_SAFE_INTEGER);
    if (roleDelta !== 0) return roleDelta;
    return String(a.name || "").localeCompare(String(b.name || "")) || Number(a.id || 0) - Number(b.id || 0);
  });
}

function formatRoleName(value) {
  const normalized = String(value || "").trim();
  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    if (numeric === ROLES.SUPER_ADMIN) return "Super Admin";
    if (numeric === ROLES.ADMIN) return "Admin";
    if (numeric === ROLES.MANAGER) return "Manager";
    if (numeric === ROLES.TEAM_LEAD) return "Team Lead";
    if (numeric === ROLES.USER) return "User";
  }
  return normalized || "-";
}

export default Users;
