const path = require("path");
const express = require("express");
const cors = require("cors");

require("dotenv").config();

const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const teamRoutes = require("./routes/teamRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const clientRoutes = require("./routes/clientRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dailyScrumRoutes = require("./routes/dailyScrumRoutes");
const incentiveRoutes = require("./routes/incentiveRoutes");
const projectNoteRoutes = require("./routes/projectNoteRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const searchRoutes = require("./routes/searchRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const officeSettingRoutes = require("./routes/officeSettingRoutes");
const platformRoutes = require("./routes/platformRoutes");
const tenantContextMiddleware = require("./middleware/tenantContextMiddleware");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    corsOrigins.length > 0
      ? {
          origin: corsOrigins,
        }
      : undefined
  )
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(tenantContextMiddleware);
app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.json({
    message: "IT ERP Backend Running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    port: PORT,
  });
});

app.use("/auth", authRoutes);
app.use("/departments", departmentRoutes);
app.use("/teams", teamRoutes);
app.use("/roles", roleRoutes);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/leave-requests", leaveRequestRoutes);
app.use("/payrolls", payrollRoutes);
app.use("/clients", clientRoutes);
app.use("/support-tickets", supportTicketRoutes);
app.use("/notifications", notificationRoutes);
app.use("/daily-scrums", dailyScrumRoutes);
app.use("/incentives", incentiveRoutes);
app.use("/project-notes", projectNoteRoutes);
app.use("/reports", reportRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/search", searchRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/office-settings", officeSettingRoutes);
app.use("/platform", platformRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({
    message: "Internal server error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
