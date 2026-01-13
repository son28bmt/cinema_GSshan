const pool = require("../config/db");

const buildAudienceClause = () =>
  `(
    (
      (n.audience = 'all' OR (n.audience = 'role' AND n.target_role = ?))
      AND n.created_at >= u.created_at
    )
    OR
    (n.audience = 'user' AND n.target_user_id = ?)
  )`;

const createNotification = async ({
  title,
  message,
  audience,
  type,
  targetRole,
  targetUserId,
  status,
  createdBy,
}) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (title, message, audience, type, target_role, target_user_id, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      message,
      audience,
      type || "normal",
      targetRole || null,
      targetUserId || null,
      status || "sent",
      createdBy || null,
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
      totalPages,
    },
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

  const [userRows] = await pool.query(
    "SELECT COUNT(*) AS total_users FROM users"
  );

  return {
    total: rows[0]?.total || 0,
    sent: rows[0]?.sent || 0,
    draft: rows[0]?.draft || 0,
    totalUsers: userRows[0]?.total_users || 0,
  };
};

const listUserNotifications = async ({
  userId,
  role,
  limit = 10,
  page = 1,
}) => {
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
     JOIN users u ON u.id = ?
     LEFT JOIN user_notifications un
       ON un.notification_id = n.id AND un.user_id = u.id
     WHERE n.status = 'sent' AND ${buildAudienceClause()}
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, role, userId, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications n
     JOIN users u ON u.id = ?
     WHERE n.status = 'sent' AND ${buildAudienceClause()}`,
    [userId, role, userId]
  );

  const total = countRows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    rows,
    pagination: {
      page,
      total,
      totalPages,
    },
  };
};

const getUnreadCount = async ({ userId, role }) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications n
     JOIN users u ON u.id = ?
     LEFT JOIN user_notifications un
       ON un.notification_id = n.id AND un.user_id = u.id
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
     JOIN users u ON u.id = ?
     WHERE n.id = ? AND n.status = 'sent' AND ${buildAudienceClause()}
     LIMIT 1`,
    [userId, notificationId, role, userId]
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
     JOIN users u ON u.id = ?
     WHERE n.status = 'sent' AND ${buildAudienceClause()}
     ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)`,
    [userId, userId, role, userId]
  );
};

const deleteNotification = async (id) => {
  const [result] = await pool.query("DELETE FROM notifications WHERE id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

const notifyEpisodeRelease = async (movieId, episodeTitle, episodeNumber) => {
  const [movies] = await pool.query("SELECT title FROM movies WHERE id = ?", [
    movieId,
  ]);
  const movieTitle = movies[0]?.title || "Phim";

  const message = `Tập ${episodeNumber}${
    episodeTitle ? `: ${episodeTitle}` : ""
  } của phim ${movieTitle} vừa ra mắt!`;
  const title = `Tập mới: ${movieTitle}`;

  // Insert notification for all subscribers and favoriters
  const [result] = await pool.query(
    `INSERT INTO notifications (title, message, audience, type, target_user_id, status, created_at)
     SELECT DISTINCT
       ?,
       ?,
       'user',
       'normal',
       u.id,
       'sent',
       NOW()
     FROM users u
     JOIN (
       SELECT user_id FROM movie_subscriptions WHERE movie_id = ?
       UNION
       SELECT user_id FROM favorites WHERE movie_id = ?
     ) AS recipients ON recipients.user_id = u.id`,
    [title, message, movieId, movieId]
  );
  console.log(
    `[Notification] Created ${result.affectedRows} notifications for MovieID=${movieId}`
  );
};

const getLatestPopup = async ({ userId, role }) => {
  if (!userId) {
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.message, n.created_at
       FROM notifications n
       WHERE n.type = 'popup'
         AND n.status = 'sent'
         AND n.audience = 'all'
       ORDER BY n.created_at DESC
       LIMIT 1`
    );
    return rows[0];
  }

  // Logic: Get the latest 'sent' popup that matches the user's audience criteria
  // And was created AFTER the user joined (handled by buildAudienceClause)
  const [rows] = await pool.query(
    `SELECT n.id, n.title, n.message, n.created_at
     FROM notifications n
     JOIN users u ON u.id = ?
     WHERE n.type = 'popup'
       AND n.status = 'sent'
       AND ${buildAudienceClause()}
     ORDER BY n.created_at DESC
     LIMIT 1`,
    [userId, role, userId]
  );
  return rows[0];
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
  deleteNotification,
  notifyEpisodeRelease,
  getLatestPopup,
};
