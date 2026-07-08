const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { ROLES, USER_ADMIN_ROLE_IDS } = require("../constants/roles");

const {
  createOfficeSetting,
  getOfficeSetting,
} = require("../controllers/officeSettingController");

router.use(authMiddleware);
router.get("/", authorize(...USER_ADMIN_ROLE_IDS), getOfficeSetting);
router.post("/", authorize(ROLES.ADMIN), createOfficeSetting);

module.exports = router;
