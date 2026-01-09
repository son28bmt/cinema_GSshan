const express = require("express");
const requireAuth = require("../middlewares/auth");
const {
  getProfileSummary,
  updateProfile,
  updateEmail,
  updateSettings,
  changePassword,
  listDevices,
  recordWatchHistory
} = require("../controllers/profile.controller");

const router = express.Router();

router.get("/", requireAuth, getProfileSummary);
router.put("/", requireAuth, updateProfile);
router.put("/email", requireAuth, updateEmail);
router.put("/settings", requireAuth, updateSettings);
router.put("/password", requireAuth, changePassword);
router.get("/devices", requireAuth, listDevices);
router.post("/history", requireAuth, recordWatchHistory);

module.exports = router;
