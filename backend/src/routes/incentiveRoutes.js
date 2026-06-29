const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { PAYROLL_MANAGER_ROLE_IDS } = require("../constants/roles");

const {
  getIncentives,
  createIncentive,
  getIncentiveById,
  updateIncentive,
  deleteIncentive
} = require("../controllers/incentiveController");

router.use(authMiddleware);
router.get("/", getIncentives);
router.post("/", authorize(...PAYROLL_MANAGER_ROLE_IDS), createIncentive);
router.get("/:id", getIncentiveById);
router.put("/:id", authorize(...PAYROLL_MANAGER_ROLE_IDS), updateIncentive);
router.delete("/:id", authorize(...PAYROLL_MANAGER_ROLE_IDS), deleteIncentive);
module.exports = router;
