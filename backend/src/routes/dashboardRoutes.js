const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getDashboard,
  getAttendanceStats,
  getProjectStats,
  getEmployeeStats,
  getPayrollStats,
  getSupportStats,
  getReportStats
} = require("../controllers/dashboardController");

router.use(authMiddleware);
router.get("/", getDashboard);
router.get("/attendance-stats", getAttendanceStats);
router.get("/project-stats", getProjectStats);
router.get("/employee-stats", getEmployeeStats);
router.get("/payroll-stats", getPayrollStats);
router.get("/support-stats", getSupportStats);
router.get("/report-stats", getReportStats);
module.exports = router;
