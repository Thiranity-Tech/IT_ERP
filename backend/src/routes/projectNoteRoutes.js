const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getProjectNotes,
  createProjectNote,
  getProjectNoteById,
  updateProjectNote,
  deleteProjectNote
} = require("../controllers/projectNoteController");

router.use(authMiddleware);
router.get("/", getProjectNotes);
router.post("/", createProjectNote);
router.get("/:id", getProjectNoteById);
router.put("/:id", updateProjectNote);
router.delete("/:id", deleteProjectNote);
module.exports = router;
