const pool = require("../config/db");

const isFavorite = async (userId, movieId) => {
  const [rows] = await pool.query(
    "SELECT 1 FROM favorites WHERE user_id = ? AND movie_id = ? LIMIT 1",
    [userId, movieId]
  );
  return rows.length > 0;
};

const listFavorites = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.slug,
      m.poster_url,
      m.release_year,
      f.created_at
     FROM favorites f
     JOIN movies m ON m.id = f.movie_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
};

const addFavorite = async (userId, movieId) => {
  await pool.query(
    "INSERT IGNORE INTO favorites (user_id, movie_id) VALUES (?, ?)",
    [userId, movieId]
  );
};

const removeFavorite = async (userId, movieId) => {
  const [result] = await pool.query(
    "DELETE FROM favorites WHERE user_id = ? AND movie_id = ?",
    [userId, movieId]
  );
  return result.affectedRows > 0;
};

module.exports = {
  isFavorite,
  listFavorites,
  addFavorite,
  removeFavorite
};
