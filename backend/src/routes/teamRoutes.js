const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { TEAM_ADMIN_ROLE_IDS } = require("../constants/roles");

const {
  getTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam
} = require("../controllers/teamController");
router.post("/", authMiddleware, authorize(...TEAM_ADMIN_ROLE_IDS), createTeam);
router.put("/:id", authMiddleware, authorize(...TEAM_ADMIN_ROLE_IDS), updateTeam);
router.delete("/:id", authMiddleware, authorize(...TEAM_ADMIN_ROLE_IDS), deleteTeam);
router.get("/", getTeams);
router.get("/:id", getTeamById);
module.exports = router;
