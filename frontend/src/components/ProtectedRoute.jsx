import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, minRole = 1 }) {
  const token = localStorage.getItem("token");
  const roleId = Number(localStorage.getItem("roleId") || 0);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roleId < minRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
