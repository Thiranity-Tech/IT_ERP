const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { ROLES } = require("../constants/roles");

const {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");
router.post("/", authMiddleware, authorize(ROLES.SUPER_ADMIN), createDepartment);
router.put("/:id", authMiddleware, authorize(ROLES.SUPER_ADMIN), updateDepartment);
router.delete("/:id", authMiddleware, authorize(ROLES.SUPER_ADMIN), deleteDepartment);
router.get("/", authMiddleware, getDepartments);
router.get("/:id", authMiddleware, getDepartmentById);
module.exports = router;
