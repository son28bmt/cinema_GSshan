const express = require("express");
const requireAuth = require("../middlewares/auth");
const {
  getSubscriptionStatus,
  listSubscriptions,
  addSubscription,
  removeSubscription
} = require("../controllers/subscription.controller");

const router = express.Router();

router.get("/", requireAuth, (req, res, next) => {
  if (req.query.movieId) {
    return getSubscriptionStatus(req, res, next);
  }
  return listSubscriptions(req, res, next);
});
router.post("/", requireAuth, addSubscription);
router.delete("/:movieId", requireAuth, removeSubscription);

module.exports = router;
