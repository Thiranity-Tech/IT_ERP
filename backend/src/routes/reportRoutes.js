const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { USER_ADMIN_ROLE_IDS } = require("../constants/roles");

const { getReports,createReport,getReportById,updateReport,deleteReport } = require("../controllers/reportController");
const upload = require("../config/multer");

router.use(authMiddleware);
router.post(
  "/",
  authorize(...USER_ADMIN_ROLE_IDS),
  upload.single("file"),
  createReport
);
router.get("/", getReports);
router.get("/:id", getReportById);
router.put("/:id", authorize(...USER_ADMIN_ROLE_IDS), updateReport);
router.delete("/:id", authorize(...USER_ADMIN_ROLE_IDS), deleteReport);
module.exports = router;
