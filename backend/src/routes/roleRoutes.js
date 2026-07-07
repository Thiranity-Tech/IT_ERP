const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { ROLES } = require("../constants/roles");

const { getRoles, updateRoleBaseSalary } = require("../controllers/roleController");

router.use(authMiddleware);
router.get("/", getRoles);
router.put("/:id/base-salary", authorize(ROLES.SUPER_ADMIN), updateRoleBaseSalary);

module.exports = router;
