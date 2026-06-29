const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { globalSearch } = require("../controllers/searchController");

router.use(authMiddleware);
router.get("/", globalSearch);

module.exports = router;
