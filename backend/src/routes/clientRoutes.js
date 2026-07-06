const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { PROJECT_MANAGER_ROLE_IDS } = require("../constants/roles");

const {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  searchClients
} = require("../controllers/clientController");

router.use(authMiddleware);
router.get("/", authorize(...PROJECT_MANAGER_ROLE_IDS), getClients);
router.post("/", authorize(...PROJECT_MANAGER_ROLE_IDS), createClient);
router.get("/search", authorize(...PROJECT_MANAGER_ROLE_IDS), searchClients);
router.get("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), getClientById);
router.put("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), updateClient);
router.delete("/:id", authorize(...PROJECT_MANAGER_ROLE_IDS), deleteClient);
module.exports = router;
