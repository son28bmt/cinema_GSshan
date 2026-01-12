const express = require("express");
const { listUsers, getLeaderboard } = require("../controllers/user.controller");
const requireAuth = require("../middlewares/auth");
const { requireAdmin } = require("../middlewares/auth"); // Assuming admin check is also in middleware

const router = express.Router();

router.get("/", requireAuth, requireAdmin, listUsers);
router.get("/leaderboard", getLeaderboard);
router.get(
  "/:id",
  requireAuth,
  requireAdmin,
  require("../controllers/user.controller").getUser
);
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  require("../controllers/user.controller").updateUser
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  require("../controllers/user.controller").deleteUser
);

module.exports = router;
