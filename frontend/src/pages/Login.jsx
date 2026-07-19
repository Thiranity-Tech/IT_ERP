import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import PasswordInput from "../components/PasswordInput";

const workQuotes = [
  "Small improvements, done daily, become the system everyone trusts.",
  "Clear work creates calm teams.",
  "Progress is easier when every detail has a place.",
  "A good workflow removes noise before it becomes pressure.",
  "Teams move faster when information is easy to find.",
  "Reliable records are quiet confidence.",
  "Plan the work, track the truth, improve the day.",
  "Great operations feel simple because the hard parts are organized.",
  "The best teams do not chase updates; they build them into the flow.",
  "Clean systems give people more room to think.",
  "Every accurate entry protects tomorrow's decision.",
  "Good work becomes great when the process supports it.",
  "Organized teams spend less time searching and more time solving.",
  "A calm dashboard is a productive team's morning coffee.",
  "Strong operations are built one dependable record at a time.",
  "Make the next step obvious, and work starts moving.",
  "When the workflow is clear, people can focus on the work.",
  "Better visibility turns busy days into managed days.",
  "A useful system helps people finish, not just report.",
  "Consistency is the quiet engine of every growing company.",
  "Good tools do not shout; they make work feel lighter.",
  "The right record today prevents the wrong question tomorrow.",
  "Clarity is a team advantage.",
  "Track what matters, simplify what repeats.",
  "A smooth process is respect for everyone's time.",
  "Reliable systems turn effort into momentum.",
  "Less confusion, more completion.",
  "Every workflow should help the team breathe easier.",
  "Great execution starts with shared clarity.",
  "A well-run day begins with information in the right place.",
  "Simple systems scale better than complicated reminders.",
];

function getDailyQuote() {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = "itErpDailyQuoteHistory";
  const fallbackIndex = Math.floor(Date.now() / 86400000) % workQuotes.length;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (saved.date === today && Number.isInteger(saved.index)) {
      return workQuotes[saved.index] || workQuotes[fallbackIndex];
    }

    const used = Array.isArray(saved.used) ? saved.used : [];
    const remaining = workQuotes
      .map((_, index) => index)
      .filter((index) => !used.includes(index));
    const pool = remaining.length ? remaining : workQuotes.map((_, index) => index);
    const index = pool[fallbackIndex % pool.length];

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: today,
        index,
        used: remaining.length ? [...used, index] : [index],
      })
    );

    return workQuotes[index];
  } catch (error) {
    return workQuotes[fallbackIndex];
  }
}

function Login() {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const quoteRef = useRef(getDailyQuote());
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
            <div className="login-title-row">
              <div className="login-logo">IE</div>
              <div>
                <h1>Welcome back</h1>
                <p>Sign in to continue to your company ERP workspace.</p>
              </div>
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
              <PasswordInput
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <div className="login-form-footer">
              <Link to="/forgot-password">Forgot password?</Link>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        </div>
        <aside className="auth-art" aria-hidden="true">
          <div className="auth-shape auth-shape-coral" />
          <div className="auth-shape auth-shape-cyan" />
          <div className="auth-art-card">
            <span>Today's focus</span>
            <h2>{quoteRef.current}</h2>
            <p>
              One workspace for the records, approvals, and daily movement that keep work flowing.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default Login;
