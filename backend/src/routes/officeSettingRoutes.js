const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { USER_ADMIN_ROLE_IDS } = require("../constants/roles");

const {
  createOfficeSetting,
  getOfficeSetting,
} = require("../controllers/officeSettingController");

router.use(authMiddleware);
router.post("/", authorize(...USER_ADMIN_ROLE_IDS), createOfficeSetting);
router.get("/", authorize(...USER_ADMIN_ROLE_IDS), getOfficeSetting);

module.exports = router;
