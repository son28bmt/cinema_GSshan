const pool = require("../config/db");

const getOverview = async (req, res, next) => {
  try {
    const [[viewsRow]] = await pool.query(
      "SELECT COALESCE(SUM(views), 0) AS total_views FROM episodes"
    );
    const [[usersRow]] = await pool.query(
      "SELECT COUNT(*) AS total, SUM(status = 'active') AS active FROM users"
    );
    const [[moviesRow]] = await pool.query(
      "SELECT COUNT(*) AS total FROM movies"
    );
    const [[commentsRow]] = await pool.query(
      "SELECT COUNT(*) AS total FROM comments WHERE created_at >= NOW() - INTERVAL 1 DAY"
    );

    const [weeklyRows] = await pool.query(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(views), 0) AS views
       FROM episodes
       WHERE created_at >= CURDATE() - INTERVAL 6 DAY
       GROUP BY day
       ORDER BY day`
    );
    const weeklyMap = new Map(
      weeklyRows.map((row) => {
        const key =
          typeof row.day === "string" ? row.day : row.day.toISOString().slice(0, 10);
        return [key, Number(row.views)];
      })
    );
    const weeklyPoints = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      return weeklyMap.get(key) || 0;
    });

    const [categoryRows] = await pool.query(
      `SELECT g.name AS label, COUNT(DISTINCT m.id) AS total
       FROM genres g
       LEFT JOIN movie_genres mg ON mg.genre_id = g.id
       LEFT JOIN movies m
         ON m.id = mg.movie_id
         AND YEAR(m.created_at) = YEAR(CURDATE())
         AND MONTH(m.created_at) = MONTH(CURDATE())
       GROUP BY g.id
       ORDER BY total DESC, g.name ASC
       LIMIT 4`
    );

    const [recentRows] = await pool.query(
      `SELECT
        m.id,
        m.title,
        m.release_year,
        m.status,
        COALESCE(SUM(e.views), 0) AS views,
        GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres
       FROM movies m
       LEFT JOIN movie_genres mg ON mg.movie_id = m.id
       LEFT JOIN genres g ON g.id = mg.genre_id
       LEFT JOIN episodes e ON e.movie_id = m.id
       GROUP BY m.id, m.title, m.release_year, m.status
       ORDER BY m.created_at DESC
       LIMIT 3`
    );

    const [hotRows] = await pool.query(
      `SELECT
        m.id,
        m.title,
        COALESCE(SUM(e.views), 0) AS views
       FROM movies m
       LEFT JOIN episodes e ON e.movie_id = m.id
       GROUP BY m.id, m.title
       ORDER BY views DESC, m.created_at DESC
       LIMIT 3`
    );

    return res.status(200).json({
      stats: {
        totalViews: Number(viewsRow.total_views || 0),
        activeUsers: Number(usersRow.active || 0),
        totalMovies: Number(moviesRow.total || 0),
        newComments: Number(commentsRow.total || 0)
      },
      weeklyPoints,
      categoryBars: categoryRows.map((row) => ({
        label: row.label,
        value: Number(row.total || 0)
      })),
      recentMovies: recentRows.map((row) => ({
        id: row.id,
        title: row.title,
        year: row.release_year,
        genres: row.genres,
        status: row.status,
        views: Number(row.views || 0)
      })),
      hotMovies: hotRows.map((row, index) => ({
        rank: index + 1,
        title: row.title,
        views: Number(row.views || 0)
      }))
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getOverview
};
