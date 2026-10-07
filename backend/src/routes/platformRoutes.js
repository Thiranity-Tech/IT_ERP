const express = require("express");
const auth = require("../middleware/authMiddleware");
const platformAdmin = require("../middleware/platformAdminMiddleware");
const { listCompanies, updateCompanyAccess } = require("../controllers/platformController");

const router = express.Router();
router.use(auth, platformAdmin);
router.get("/companies", listCompanies);
router.patch("/companies/:id/access", updateCompanyAccess);
module.exports = router;
