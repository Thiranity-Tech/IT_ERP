const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getDailyScrums,
  createDailyScrum,
  getDailyScrumById,
  updateDailyScrum,
  deleteDailyScrum
} = require("../controllers/dailyScrumController");

router.use(authMiddleware);
router.get("/", getDailyScrums);
router.post("/", createDailyScrum);
router.get("/:id", getDailyScrumById);
router.put("/:id", updateDailyScrum);
router.delete("/:id", deleteDailyScrum);
module.exports = router;
