const express = require("express");
const router = express.Router();
const { register, login, getProfile, logout } = require("../controllers/authController");
const { googleStart, googleCallback } = require("../controllers/googleAuthController");
const { protect } = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post(
  "/logout",
  logout
);

router.get("/google", googleStart);
router.get("/google/callback", googleCallback);

module.exports = router;