const pool = require("../config/db");

const listComments = async ({ limit = 20, movieId, episodeId, status }) => {
  const filters = [];
  const params = [];

  if (movieId) {
    filters.push("c.movie_id = ?");
    params.push(movieId);
  }
  if (episodeId) {
    filters.push("c.episode_id = ?");
    params.push(episodeId);
  }
  if (status) {
    filters.push("c.status = ?");
    params.push(status);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.content,
      c.status,
      c.parent_id,
      c.movie_id,
      c.episode_id,
      c.report_reason,
      c.created_at,
      c.author_ip,
      COALESCE(u.name, c.author_name, 'Khach') AS author_name,
      u.email AS author_email,
      u.xp AS author_xp,
      u.avatar_url AS author_avatar,
      u.role AS author_role,
      m.title AS movie_title,
      m.slug AS movie_slug,
      e.episode_number AS episode_number
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN movies m ON m.id = c.movie_id
     LEFT JOIN episodes e ON e.id = c.episode_id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [...params, limit]
  );
  return rows;
};

const createComment = async ({
  userId,
  movieId,
  episodeId,
  parentId,
  content,
  authorName,
  authorIp,
}) => {
  const [result] = await pool.query(
    `INSERT INTO comments (user_id, movie_id, episode_id, parent_id, author_name, author_ip, content, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
    [
      userId,
      movieId || null,
      episodeId || null,
      parentId || null,
      authorName || null,
      authorIp || null,
      content,
    ]
  );

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.content,
      c.status,
      c.parent_id,
      c.movie_id,
      c.episode_id,
      c.report_reason,
      c.created_at,
      c.author_ip,
      COALESCE(u.name, c.author_name, 'Khach') AS author_name,
      u.email AS author_email,
      u.xp AS author_xp,
      u.avatar_url AS author_avatar,
      u.role AS author_role,
      m.title AS movie_title,
      m.slug AS movie_slug,
      e.episode_number AS episode_number
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN movies m ON m.id = c.movie_id
     LEFT JOIN episodes e ON e.id = c.episode_id
     WHERE c.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0];
};

const findCommentById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, movie_id, episode_id, parent_id, status
     FROM comments
     WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
};

const reportComment = async ({ commentId, reason }) => {
  const [result] = await pool.query(
    `UPDATE comments
     SET status = 'reported', report_reason = ?
     WHERE id = ?`,
    [reason, commentId]
  );
  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.content,
      c.status,
      c.parent_id,
      c.movie_id,
      c.episode_id,
      c.report_reason,
      c.created_at,
      c.author_ip,
      COALESCE(u.name, c.author_name, 'Khach') AS author_name,
      u.email AS author_email,
      u.xp AS author_xp,
      u.avatar_url AS author_avatar,
      u.role AS author_role,
      m.title AS movie_title,
      m.slug AS movie_slug,
      e.episode_number AS episode_number
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN movies m ON m.id = c.movie_id
     LEFT JOIN episodes e ON e.id = c.episode_id
     WHERE c.id = ? LIMIT 1`,
    [commentId]
  );

  return rows[0];
};

const getCommentStats = async () => {
  const [rows] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(status = 'pending') AS pending,
      SUM(status = 'approved') AS approved,
      SUM(status = 'reported') AS reported,
      SUM(status = 'pinned') AS pinned
     FROM comments`
  );
  return (
    rows[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      reported: 0,
      pinned: 0,
    }
  );
};

const deleteComment = async (id) => {
  const [result] = await pool.query("DELETE FROM comments WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

const hasCommentedOn = async (userId, movieId, episodeId) => {
  const filters = ["user_id = ?"];
  const params = [userId];

  if (movieId) {
    filters.push("movie_id = ?");
    params.push(movieId);
  }
  if (episodeId) {
    filters.push("episode_id = ?");
    params.push(episodeId);
  }

  const query = `SELECT id FROM comments WHERE ${filters.join(
    " AND "
  )} LIMIT 1`;
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

const getLastGeneralCommentTime = async (userId) => {
  const [rows] = await pool.query(
    `SELECT created_at FROM comments 
     WHERE user_id = ? AND movie_id IS NULL AND episode_id IS NULL 
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ? new Date(rows[0].created_at) : null;
};

module.exports = {
  listComments,
  createComment,
  getCommentStats,
  deleteComment,
  findCommentById,
  reportComment,
  hasCommentedOn,
  getLastGeneralCommentTime,
};
