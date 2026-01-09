const pool = require("../config/db");

const buildAudienceClause = () =>
  `(n.audience = 'all' OR (n.audience = 'role' AND n.target_role = ?) OR (n.audience = 'user' AND n.target_user_id = ?))`;

const createNotification = async ({
  title,
  message,
  audience,
  targetRole,
  targetUserId,
  status,
  createdBy
}) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (title, message, audience, target_role, target_user_id, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      message,
      audience,
      targetRole || null,
      targetUserId || null,
      status || "sent",
      createdBy || null
    ]
  );

  const [rows] = await pool.query(
    `SELECT n.*, u.email AS created_by_email, tu.email AS target_user_email
     FROM notifications n
     LEFT JOIN users u ON u.id = n.created_by
     LEFT JOIN users tu ON tu.id = n.target_user_id
     WHERE n.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0];
};

const listNotifications = async ({ limit = 20, page = 1, status, q }) => {
  const filters = [];
  const params = [];

  if (status && status !== "all") {
    filters.push("n.status = ?");
    params.push(status);
  }

  if (q) {
    filters.push("(n.title LIKE ? OR n.message LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT n.*, u.email AS created_by_email, tu.email AS target_user_email
     FROM notifications n
     LEFT JOIN users u ON u.id = n.created_by
     LEFT JOIN users tu ON tu.id = n.target_user_id
     ${whereClause}
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications n ${whereClause}`,
    params
  );

  const total = countRows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    rows,
    pagination: {
      page,
      total,
      totalPages
    }
  };
};

const getNotificationStats = async () => {
  const [rows] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(status = 'sent') AS sent,
      SUM(status = 'draft') AS draft
     FROM notifications`
  );

  const [userRows] = await pool.query("SELECT COUNT(*) AS total_users FROM users");

  return {
    total: rows[0]?.total || 0,
    sent: rows[0]?.sent || 0,
    draft: rows[0]?.draft || 0,
    totalUsers: userRows[0]?.total_users || 0
  };
};

const listUserNotifications = async ({ userId, role, limit = 10, page = 1 }) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT
      n.id,
      n.title,
      n.message,
      n.audience,
      n.target_role,
      n.target_user_id,
      n.status,
      n.created_at,
      un.read_at
     FROM notifications n
     LEFT JOIN user_notifications un
       ON un.notification_id = n.id AND un.user_id = ?
     WHERE n.status = 'sent' AND ${buildAudienceClause()}
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, role, userId, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications n
     WHERE n.status = 'sent' AND ${buildAudienceClause()}`,
    [role, userId]
  );

  const total = countRows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    rows,
    pagination: {
      page,
      total,
      totalPages
    }
  };
};

const getUnreadCount = async ({ userId, role }) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications n
     LEFT JOIN user_notifications un
       ON un.notification_id = n.id AND un.user_id = ?
     WHERE n.status = 'sent'
       AND ${buildAudienceClause()}
       AND un.read_at IS NULL`,
    [userId, role, userId]
  );

  return rows[0]?.total || 0;
};

const canAccessNotification = async ({ userId, role, notificationId }) => {
  const [rows] = await pool.query(
    `SELECT n.id
     FROM notifications n
     WHERE n.id = ? AND n.status = 'sent' AND ${buildAudienceClause()}
     LIMIT 1`,
    [notificationId, role, userId]
  );

  return Boolean(rows[0]);
};

const markRead = async ({ userId, notificationId }) => {
  await pool.query(
    `INSERT INTO user_notifications (user_id, notification_id, read_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
    [userId, notificationId]
  );
};

const markAllRead = async ({ userId, role }) => {
  await pool.query(
    `INSERT INTO user_notifications (user_id, notification_id, read_at)
     SELECT ?, n.id, NOW()
     FROM notifications n
     WHERE n.status = 'sent' AND ${buildAudienceClause()}
     ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
    [userId, role, userId]
  );
};

const deleteNotification = async (id) => {
  const [result] = await pool.query("DELETE FROM notifications WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createNotification,
  listNotifications,
  getNotificationStats,
  listUserNotifications,
  getUnreadCount,
  canAccessNotification,
  markRead,
  markAllRead,
  deleteNotification
};
