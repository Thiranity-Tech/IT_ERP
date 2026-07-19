import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import PasswordInput from "../components/PasswordInput";

const recoveryQuotes = [
  "Secure access keeps good work moving.",
  "A small reset can put the whole day back on track.",
  "Strong systems make recovery simple.",
  "Good operations protect both people and progress.",
  "Clarity starts with safe access.",
];

function getRecoveryQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return recoveryQuotes[day % recoveryQuotes.length];
}

function ForgotPassword() {
  const navigate = useNavigate();
  const employeeIdRef = useRef(null);
  const pinRef = useRef(null);
  const newPasswordRef = useRef(null);
  const quoteRef = useRef(getRecoveryQuote());
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

  useEffect(() => {
    if (step === "request") {
      employeeIdRef.current?.focus();
    } else if (step === "verify") {
      pinRef.current?.focus();
    } else if (step === "reset") {
      newPasswordRef.current?.focus();
    }
  }, [step]);

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
      if (res.data.devHint) {
        console.info(res.data.devHint);
      }
      setStep("verify");
    } catch (err) {
      const message =
        err.code === "ECONNABORTED"
          ? "Delivery is taking too long. Check Brevo API or SMTP settings and try again."
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
            <div className="login-title-row">
              <div className="login-logo">IE</div>
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>
          </div>

          {error && <div className="empty-state" style={{ color: "var(--danger)" }}>{error}</div>}

          {step === "request" && (
            <form className="form-grid" onSubmit={requestReset}>
              <label className="field">
                <span>Employee ID</span>
                <input
                  ref={employeeIdRef}
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
                  ref={pinRef}
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
                <PasswordInput
                  ref={newPasswordRef}
                  autoFocus
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
        <aside className="auth-art" aria-hidden="true">
          <div className="auth-shape auth-shape-coral" />
          <div className="auth-shape auth-shape-cyan" />
          <div className="auth-art-card">
            <span>Account recovery</span>
            <h2>{quoteRef.current}</h2>
            <p>
              Reset your password through the registered company email and return to your ERP workspace.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default ForgotPassword;
