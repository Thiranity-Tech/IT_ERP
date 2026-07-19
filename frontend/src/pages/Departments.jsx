import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageDepartments } from "../constants/roles";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState("");
  const [busyDepartmentId, setBusyDepartmentId] = useState(null);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditDepartments = canManageDepartments(roleId);

  const loadDepartments = () => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => {
        console.error(err);
        setMessage("Failed to load departments");
      });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Delete ${department.name}? This is allowed only when no teams, users, or projects are linked to the department.`
    );

    if (!confirmed) {
      return;
    }

    setBusyDepartmentId(department.id);
    setMessage("");

    try {
      await api.delete(`/departments/${department.id}`);
      setMessage("Department deleted successfully");
      loadDepartments();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to delete department");
    } finally {
      setBusyDepartmentId(null);
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Departments</h1>
          <p className="subtle">Company structure and team grouping.</p>
        </div>
        {canEditDepartments && (
        <div className="actions">
          <button className="btn btn-primary" onClick={() => navigate("/create-department")}>
            Create Department
          </button>
        </div>
        )}
      </div>

      {message && <div className="form-error">{message}</div>}

      <div className="table-panel">
        <table className="erp-table">
          <thead>
          <tr>
              <th>S.No.</th>
              <th>Department Name</th>
              {canEditDepartments && <th>Settings</th>}
            </tr>
          </thead>

          <tbody>
            {departments.map((d, index) => (
              <tr key={d.id}>
                <td>{index + 1}</td>
                <td>{d.name}</td>
                {canEditDepartments && (
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/edit-department/${d.id}`)}
                        type="button"
                      >
                        Rename
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyDepartmentId === d.id}
                        onClick={() => handleDelete(d)}
                        type="button"
                      >
                        {busyDepartmentId === d.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!departments.length && (
              <tr>
                <td colSpan={canEditDepartments ? 3 : 2}>No departments created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Departments;
