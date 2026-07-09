const express = require("express");
const router = express.Router();

const {
  createSuperAdmin,
  login,
  changePassword,
  forgotPassword,
  requestPasswordReset,
  verifyPasswordReset,
  completePasswordReset
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/create-super-admin", createSuperAdmin);

router.post("/login", login);

// Protected Route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route",
    user: req.user
  });
});
router.put(
  "/change-password",
  authMiddleware,
  changePassword
);
router.post(
  "/forgot-password",
  forgotPassword
);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/complete-password-reset", completePasswordReset);
module.exports = router;
