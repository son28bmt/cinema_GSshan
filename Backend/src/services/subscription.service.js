const pool = require("../config/db");

const isSubscribed = async (userId, movieId) => {
  const [rows] = await pool.query(
    "SELECT 1 FROM movie_subscriptions WHERE user_id = ? AND movie_id = ? LIMIT 1",
    [userId, movieId]
  );
  return rows.length > 0;
};

const listSubscriptions = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.slug,
      m.poster_url,
      m.release_year,
      s.created_at
     FROM movie_subscriptions s
     JOIN movies m ON m.id = s.movie_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
};

const addSubscription = async (userId, movieId) => {
  await pool.query(
    "INSERT IGNORE INTO movie_subscriptions (user_id, movie_id) VALUES (?, ?)",
    [userId, movieId]
  );
};

const removeSubscription = async (userId, movieId) => {
  const [result] = await pool.query(
    "DELETE FROM movie_subscriptions WHERE user_id = ? AND movie_id = ?",
    [userId, movieId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  isSubscribed,
  listSubscriptions,
  addSubscription,
  removeSubscription
};
