import { useEffect, useState } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { canManageTeams } from "../constants/roles";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");
  const [busyTeamId, setBusyTeamId] = useState(null);
  const navigate = useNavigate();
  const roleId = Number(localStorage.getItem("roleId") || 1);
  const canEditTeams = canManageTeams(roleId);

  const loadTeams = () => {
    api
      .get("/teams")
      .then((res) => setTeams(res.data))
      .catch((err) => {
        console.error(err);
        setMessage("Failed to load teams");
      });
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleDelete = async (team) => {
    const confirmed = window.confirm(
      `Delete ${team.name}? This is allowed only when no users or tasks are linked to the team.`
    );

    if (!confirmed) {
      return;
    }

    setBusyTeamId(team.id);
    setMessage("");

    try {
      await api.delete(`/teams/${team.id}`);
      setMessage("Team deleted successfully");
      loadTeams();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to delete team");
    } finally {
      setBusyTeamId(null);
    }
  };

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

      {message && <div className="form-error">{message}</div>}

      <div className="table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Team Name</th>
              <th>Department</th>
              {canEditTeams && <th>Settings</th>}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id}>
                <td>{index + 1}</td>
                <td>{team.name}</td>
                <td>{team.department?.name || team.departmentId}</td>
                {canEditTeams && (
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/edit-team/${team.id}`)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busyTeamId === team.id}
                        onClick={() => handleDelete(team)}
                        type="button"
                      >
                        {busyTeamId === team.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!teams.length && (
              <tr>
                <td colSpan={canEditTeams ? 4 : 3}>No teams created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Teams;
