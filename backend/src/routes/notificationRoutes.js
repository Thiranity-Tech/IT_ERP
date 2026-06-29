const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getNotifications,
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead
} = require("../controllers/notificationController");

router.use(authMiddleware);
router.get("/", getNotifications);
router.post("/", createNotification);
router.get("/:id", getNotificationById);
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);
router.put("/:id/read", markAsRead);
module.exports = router;
