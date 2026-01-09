const pool = require("../config/db");

const upsertRating = async ({ userId, movieId, rating }) => {
  await pool.query(
    `INSERT INTO ratings (user_id, movie_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
    [userId, movieId, rating]
  );
};

const getRatingSummary = async (movieId) => {
  const [rows] = await pool.query(
    `SELECT
      AVG(rating) AS average,
      COUNT(*) AS total,
      SUM(rating = 5) AS count5,
      SUM(rating = 4) AS count4,
      SUM(rating = 3) AS count3,
      SUM(rating = 2) AS count2,
      SUM(rating = 1) AS count1
     FROM ratings
     WHERE movie_id = ?`,
    [movieId]
  );
  const row = rows[0] || {};
  return {
    average: Number(row.average || 0),
    total: Number(row.total || 0),
    counts: {
      5: Number(row.count5 || 0),
      4: Number(row.count4 || 0),
      3: Number(row.count3 || 0),
      2: Number(row.count2 || 0),
      1: Number(row.count1 || 0),
    }
  };
};

module.exports = {
  upsertRating,
  getRatingSummary
};
