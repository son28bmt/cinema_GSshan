const express = require("express");
const requireAuth = require("../middlewares/auth");
const {
  listNotifications,
  createNotification,
  deleteNotification,
  listInbox,
  getUnreadCount,
  markRead,
  markAllRead,
  getPopup,
} = require("../controllers/notification.controller");

const router = express.Router();

router.get("/inbox", requireAuth, listInbox);
router.get("/popup", getPopup); // Public route
router.get("/unread-count", requireAuth, getUnreadCount);
router.post("/mark-all-read", requireAuth, markAllRead);
router.post("/:id/read", requireAuth, markRead);

router.get("/", requireAuth, listNotifications);
router.post("/", requireAuth, createNotification);
router.delete("/:id", requireAuth, deleteNotification);

module.exports = router;
