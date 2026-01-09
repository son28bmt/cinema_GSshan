const express = require("express");
const { getRatingSummary, setRating } = require("../controllers/rating.controller");
const requireAuth = require("../middlewares/auth");

const router = express.Router();

router.get("/", getRatingSummary);
router.post("/", requireAuth, setRating);

module.exports = router;
