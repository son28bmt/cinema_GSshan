const express = require("express");
const { listUsers, getLeaderboard } = require("../controllers/user.controller");
const requireAuth = require("../middlewares/auth");
const { requireAdmin } = require("../middlewares/auth"); // Assuming admin check is also in middleware

const router = express.Router();

router.get("/", requireAuth, requireAdmin, listUsers);
router.get("/leaderboard", getLeaderboard); // Public or auth? Let's make it public for now

module.exports = router;
