const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { LEAVE_APPROVER_ROLE_IDS } = require("../constants/roles");

const {
  getLeaveRequests,
  createLeaveRequest,
  getLeaveRequestById,
  updateLeaveStatus,
  updateLeaveRequest,
  deleteLeaveRequest
} = require("../controllers/leaveRequestController");

router.use(authMiddleware);
router.get("/", getLeaveRequests);
router.post("/", createLeaveRequest);
router.get("/:id", getLeaveRequestById);
router.put(
  "/:id/status",
  authorize(...LEAVE_APPROVER_ROLE_IDS),
  updateLeaveStatus
);
router.put("/:id", updateLeaveRequest);
router.delete("/:id", deleteLeaveRequest);
module.exports = router;
