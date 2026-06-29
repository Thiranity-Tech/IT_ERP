const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  searchSupportTickets
} = require("../controllers/supportTicketController");
const {
  getSupportTicketNotes,
  createSupportTicketNote,
  deleteSupportTicketNote
} = require("../controllers/supportTicketNoteController");
const {
  getSupportTicketEvents
} = require("../controllers/supportTicketEventController");

router.use(authMiddleware);
router.get("/", getSupportTickets);
router.post("/", createSupportTicket);
router.get("/search", searchSupportTickets);
router.delete("/notes/:id", deleteSupportTicketNote);
router.get("/:ticketId/notes", getSupportTicketNotes);
router.get("/:ticketId/events", getSupportTicketEvents);
router.post("/:ticketId/notes", createSupportTicketNote);
router.get("/:id", getSupportTicketById);
router.put("/:id", updateSupportTicket);
router.delete("/:id", deleteSupportTicket);
module.exports = router;
