const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { TASK_MANAGER_ROLE_IDS } = require("../constants/roles");

const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
} = require("../controllers/taskController");

router.use(authMiddleware);
router.get("/", getTasks);
router.post("/", authorize(...TASK_MANAGER_ROLE_IDS), createTask);
router.get("/:id", getTaskById);
router.put("/:id", authorize(...TASK_MANAGER_ROLE_IDS), updateTask);
router.delete("/:id", authorize(...TASK_MANAGER_ROLE_IDS), deleteTask);
module.exports = router;
