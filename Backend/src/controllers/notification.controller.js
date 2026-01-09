const notificationService = require("../services/notification.service");
const userService = require("../services/user.service");

const requireAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

const listNotifications = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const limit = Number.parseInt(req.query.limit || "10", 10);
    const page = Number.parseInt(req.query.page || "1", 10);
    const status = req.query.status || "all";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const result = await notificationService.listNotifications({
      limit,
      page,
      status,
      q: q || null
    });
    const stats = await notificationService.getNotificationStats();

    return res.status(200).json({
      notifications: result.rows,
      pagination: result.pagination,
      stats
    });
  } catch (err) {
    return next(err);
  }
};

const createNotification = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const {
      title,
      message,
      audience = "all",
      targetRole,
      targetUserId,
      targetEmail,
      status
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    if (!["all", "role", "user"].includes(audience)) {
      return res.status(400).json({ message: "Audience is invalid" });
    }

    let resolvedUserId = targetUserId ? Number(targetUserId) : null;
    let resolvedRole = null;
    if (audience === "role") {
      if (!targetRole || !["admin", "user"].includes(targetRole)) {
        return res.status(400).json({ message: "Target role is invalid" });
      }
      resolvedRole = targetRole;
    }

    if (audience === "user") {
      if (!resolvedUserId && targetEmail) {
        const user = await userService.findUserByEmail(targetEmail.trim());
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        resolvedUserId = user.id;
      }
      if (!resolvedUserId) {
        return res.status(400).json({ message: "Target user is required" });
      }
    }
    if (audience !== "user") {
      resolvedUserId = null;
    }
    if (audience !== "role") {
      resolvedRole = null;
    }

    const normalizedStatus =
      status && ["sent", "draft"].includes(status) ? status : "sent";

    const created = await notificationService.createNotification({
      title: title.trim(),
      message: message.trim(),
      audience,
      targetRole: resolvedRole,
      targetUserId: resolvedUserId,
      status: normalizedStatus,
      createdBy: req.user.id
    });

    return res.status(201).json({ notification: created });
  } catch (err) {
    return next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const id = Number.parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await notificationService.deleteNotification(id);
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

const listInbox = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "10", 10);
    const page = Number.parseInt(req.query.page || "1", 10);

    const result = await notificationService.listUserNotifications({
      userId: req.user.id,
      role: req.user.role,
      limit,
      page
    });

    return res.status(200).json({
      notifications: result.rows,
      pagination: result.pagination
    });
  } catch (err) {
    return next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const total = await notificationService.getUnreadCount({
      userId: req.user.id,
      role: req.user.role
    });

    return res.status(200).json({ total });
  } catch (err) {
    return next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const canAccess = await notificationService.canAccessNotification({
      userId: req.user.id,
      role: req.user.role,
      notificationId: id
    });

    if (!canAccess) {
      return res.status(404).json({ message: "Not found" });
    }

    await notificationService.markRead({
      userId: req.user.id,
      notificationId: id
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead({
      userId: req.user.id,
      role: req.user.role
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listNotifications,
  createNotification,
  deleteNotification,
  listInbox,
  getUnreadCount,
  markRead,
  markAllRead
};
