const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getRoles } = require("../controllers/roleController");

router.use(authMiddleware);
router.get("/", getRoles);

module.exports = router;
