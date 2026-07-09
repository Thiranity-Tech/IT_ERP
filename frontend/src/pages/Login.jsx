import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        employeeId,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("roleId", res.data.roleId);
      localStorage.setItem("roleName", res.data.roleName);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("employeeId", res.data.employeeId || "");
      localStorage.setItem("userName", res.data.userName || "");
      localStorage.setItem("departmentId", res.data.departmentId || "");
      localStorage.setItem("departmentName", res.data.departmentName || "");
      localStorage.setItem("teamId", res.data.teamId || "");
      localStorage.setItem("teamName", res.data.teamName || "");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="login-panel">
          <div className="login-heading">
            <span className="login-kicker">Company workspace</span>
            <div className="login-title-row">
              <div className="login-logo">IE</div>
              <div>
                <h1>IT ERP</h1>
                <p>Internal operations suite for employees, managers, and admins.</p>
              </div>
            </div>
            <div className="login-meta">
              <span className="meta-chip">Secure sign-in</span>
              <span className="meta-chip">Role-based access</span>
              <span className="meta-chip">Payroll and HR workflow</span>
            </div>
          </div>
          <div className="panel-heading">
            <h1>Sign in</h1>
            <p>Use your company username and password to continue.</p>
          </div>

          <form className="form-grid" onSubmit={handleLogin}>
            <label className="field">
              <span>Username</span>
              <input
                ref={usernameRef}
                autoFocus
                type="text"
                placeholder="Enter Username"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Login;
