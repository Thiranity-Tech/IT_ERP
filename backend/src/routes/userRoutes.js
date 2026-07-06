const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {
  ROLES,
  TASK_MANAGER_ROLE_IDS
} = require("../constants/roles");

const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers
} = require("../controllers/userController");

router.use(authMiddleware);

router.get("/", authorize(...TASK_MANAGER_ROLE_IDS), getUsers);
router.post("/", authorize(ROLES.SUPER_ADMIN), createUser);
router.get("/search", authorize(...TASK_MANAGER_ROLE_IDS), searchUsers);
router.get("/:id", authorize(...TASK_MANAGER_ROLE_IDS), getUserById);
router.put("/:id", authorize(ROLES.SUPER_ADMIN), updateUser);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN), deleteUser);

module.exports = router;
