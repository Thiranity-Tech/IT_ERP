const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getPayrolls,
  getPayrollSummary,
  createPayroll,
  generatePayroll,
  getPayrollById,
  updatePayroll,
  deletePayroll
} = require("../controllers/payrollController");

router.use(authMiddleware);

router.get("/", getPayrolls);
router.get("/summary", getPayrollSummary);
router.post("/generate", generatePayroll);
router.post("/", createPayroll);
router.get("/:id", getPayrollById);
router.put("/:id", updatePayroll);
router.delete("/:id", deletePayroll);

module.exports = router;
