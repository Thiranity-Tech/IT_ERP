import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [employeeId, setEmployeeId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => {
    if (step === "verify") return "Verify code";
    if (step === "reset") return "Set new password";
    return "Forgot password";
  }, [step]);

  const subtitle = useMemo(() => {
    if (step === "verify") return `Enter the verification code sent to ${destination}.`;
    if (step === "reset") return "Create a new password to sign back in.";
    return "Use your employee ID and we will send the reset code to your registered email.";
  }, [step, destination]);

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/request-password-reset", {
        employeeId,
      }, {
        timeout: 15000,
      });
      setRequestId(String(res.data.requestId));
      setDestination(res.data.destination || "");
      setStep("verify");
    } catch (err) {
      const message =
        err.code === "ECONNABORTED"
          ? "Delivery is taking too long. Check SMTP/Twilio settings and try again."
          : err.response?.data?.message || err.response?.data?.error || "Unable to send verification code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-password-reset", {
        requestId: Number(requestId),
        pin,
      }, {
        timeout: 15000,
      });
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const completeReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/complete-password-reset", {
        requestId: Number(requestId),
        newPassword,
      }, {
        timeout: 15000,
      });
      alert("Password reset successfully");
      window.location.replace("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="login-panel">
          <div className="login-heading">
            <span className="login-kicker">Account recovery</span>
            <div className="login-title-row">
              <div className="login-logo">IE</div>
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>
            <div className="login-meta">
              <span className="meta-chip">Email code</span>
              <span className="meta-chip">Secure reset</span>
            </div>
          </div>

          {error && <div className="empty-state" style={{ color: "var(--danger)" }}>{error}</div>}

          {step === "request" && (
            <form className="form-grid" onSubmit={requestReset}>
              <label className="field">
                <span>Employee ID</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </label>

              <div className="form-actions">
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form className="form-grid" onSubmit={verifyCode}>
              <label className="field">
                <span>Verification code</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>

              <div className="form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setStep("request")}>
                  Back
                </button>
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form className="form-grid" onSubmit={completeReset}>
              <label className="field">
                <span>New password</span>
                <input
                  autoFocus
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </label>

              <div className="form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setStep("verify")}>
                  Back
                </button>
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}

          <div className="auth-links">
            <Link to="/">Back to sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;
