import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      alert("Password changed successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="panel panel-narrow">
        <div className="panel-heading">
          <h1>Change Password</h1>
          <p>Keep your ERP account secure with a new password.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default ChangePassword;
