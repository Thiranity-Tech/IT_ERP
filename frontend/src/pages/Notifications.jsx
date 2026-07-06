import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/notifications")
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleView = async (notification) => {
    try {
      const res = await api.put(`/notifications/${notification.id}/read`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      navigate(res.data?.targetPath || notification.targetPath || "/notifications", { replace: false });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to view notification");
    }
  };

  return (
    <Layout>
      <div className="table-toolbar">
        <div>
          <h1>Notifications</h1>
          <p className="subtle">Announcements and status updates from the ERP workspace.</p>
        </div>
      </div>

      <div className="recent-grid">
        {notifications.map((n) => (
          <div className="list-card" key={n.id} style={{ cursor: "pointer" }} onClick={() => handleView(n)}>
            <h3>{n.isRead ? "Read" : "Unread"}</h3>
            <div className="subtle">{n.text || n.message}</div>
            <div className="subtle" style={{ marginTop: "12px" }}>
              Opens {n.targetPath || "/notifications"} and clears it
            </div>
          </div>
        ))}
        {!notifications.length && <div className="empty-state">No notifications.</div>}
      </div>
    </Layout>
  );
}

export default Notifications;
