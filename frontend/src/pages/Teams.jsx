import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageTeams } from "../constants/roles";

function Teams() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditTeams = canManageTeams(roleId);

  useEffect(() => {
    api
      .get("/teams")
      .then((res) => setTeams(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Teams</h1>
          <p className="subtle">Department-linked work groups and members.</p>
        </div>
        {canEditTeams && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => navigate("/create-team")} type="button">
              Create Team
            </button>
          </div>
        )}
      </div>

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Team Name</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id}>
                <td>{index + 1}</td>
                <td>{team.name}</td>
                <td>{team.department?.name || team.departmentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Teams;
