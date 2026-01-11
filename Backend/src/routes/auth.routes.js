const express = require("express");
const {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  me,
} = require("../controllers/auth.controller");
const requireAuth = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", loginWithGoogle);
router.post("/facebook", loginWithFacebook);
router.get("/me", requireAuth, me);

module.exports = router;
