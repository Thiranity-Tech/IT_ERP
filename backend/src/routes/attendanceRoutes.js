const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { PROJECT_MANAGER_ROLE_IDS } = require("../constants/roles");

const upload = require("../config/multer");

const {
  getAttendances,
  createAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  uploadAttendanceExcel,
  getAttendanceReport
} = require("../controllers/attendanceController");

router.use(authMiddleware);
router.get("/", getAttendances);
router.get("/report", getAttendanceReport);
router.get("/:id", getAttendanceById);
router.post("/", authorize(...PROJECT_MANAGER_ROLE_IDS), createAttendance);
router.put("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), updateAttendance);
router.delete("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), deleteAttendance);

router.post(
  "/upload",
  authorize(...PROJECT_MANAGER_ROLE_IDS),
  upload.single("file"),
  uploadAttendanceExcel
);

module.exports = router;
