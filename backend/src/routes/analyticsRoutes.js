const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { PROJECT_MANAGER_ROLE_IDS } = require("../constants/roles");

const {
  getProjectPriorityAnalytics,
  getLeaveStatusAnalytics,
  getTicketStatusAnalytics,
  getPayrollSummaryAnalytics,
  getAttendanceAnalytics,
  getClientAnalytics,
  getMonthlyPayrollAnalytics,
  getProjectStatusAnalytics,
  getUserRoleAnalytics,
  getTeamAnalytics,
  getAnalyticsOverview,
  getEmployeeAnalytics
} = require("../controllers/analyticsController");

router.use(authMiddleware, authorize(...PROJECT_MANAGER_ROLE_IDS));

router.get("/project-priority", getProjectPriorityAnalytics);
router.get("/leave-status", getLeaveStatusAnalytics);
router.get("/ticket-status", getTicketStatusAnalytics);
router.get("/payroll-summary", getPayrollSummaryAnalytics);
router.get("/attendance", getAttendanceAnalytics);
router.get("/client-summary", getClientAnalytics);
router.get("/monthly-payroll", getMonthlyPayrollAnalytics);
router.get("/project-status", getProjectStatusAnalytics);
router.get("/user-roles", getUserRoleAnalytics);
router.get("/teams", getTeamAnalytics);
router.get("/overview", getAnalyticsOverview);
router.get("/employee/:employeeId", getEmployeeAnalytics);

module.exports = router;
