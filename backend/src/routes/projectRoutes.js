const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { PROJECT_MANAGER_ROLE_IDS } = require("../constants/roles");

const { getProjects,createProject,updateProject,deleteProject,searchProjects, getProjectById } = require("../controllers/projectController");

router.use(authMiddleware);
router.get("/", getProjects);
router.post("/", authorize(...PROJECT_MANAGER_ROLE_IDS), createProject);
router.put("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), updateProject);
router.delete("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), deleteProject);
router.get("/search", searchProjects);
router.get("/:id",getProjectById);
module.exports = router;
