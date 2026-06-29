import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageDepartments } from "../constants/roles";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditDepartments = canManageDepartments(roleId);

  useEffect(() => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err));
  }, []);

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

      <div className="table-panel">
        <table className="erp-table">
          <thead>
          <tr>
              <th>S.No.</th>
              <th>Department Name</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((d, index) => (
              <tr key={d.id}>
                <td>{index + 1}</td>
                <td>{d.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Departments;
