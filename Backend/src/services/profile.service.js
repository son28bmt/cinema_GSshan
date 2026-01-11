const pool = require("../config/db");

const ensureSettings = async (userId) => {
  await pool.query("INSERT IGNORE INTO user_settings (user_id) VALUES (?)", [
    userId,
  ]);
};

const getSettings = async (userId) => {
  await ensureSettings(userId);
  const [rows] = await pool.query(
    `SELECT notify_new_movies, notify_new_episodes, marketing_emails
     FROM user_settings
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
};

const updateSettings = async (
  userId,
  { notifyNewMovies, notifyNewEpisodes, marketingEmails }
) => {
  await ensureSettings(userId);
  await pool.query(
    `UPDATE user_settings
     SET notify_new_movies = ?, notify_new_episodes = ?, marketing_emails = ?
     WHERE user_id = ?`,
    [
      notifyNewMovies ? 1 : 0,
      notifyNewEpisodes ? 1 : 0,
      marketingEmails ? 1 : 0,
      userId,
    ]
  );
  return getSettings(userId);
};

const getStats = async (userId) => {
  const [[favoritesRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?",
    [userId]
  );
  const [[ratingsRow]] = await pool.query(
    "SELECT COUNT(*) AS total FROM ratings WHERE user_id = ?",
    [userId]
  );
  const [[historyRow]] = await pool.query(
    `SELECT COUNT(DISTINCT movie_id) AS movies_watched,
            SUM(watch_seconds) AS watch_seconds
     FROM watch_history
     WHERE user_id = ?`,
    [userId]
  );

  return {
    movies_watched: Number(historyRow?.movies_watched || 0),
    watch_hours: Number(historyRow?.watch_seconds || 0) / 3600,
    ratings_count: Number(ratingsRow?.total || 0),
    favorites_count: Number(favoritesRow?.total || 0),
  };
};

const listWatchHistory = async (userId, limit = 6) => {
  const [rows] = await pool.query(
    `SELECT
      m.id AS movie_id,
      m.title,
      m.slug,
      m.poster_url,
      m.release_year,
      MAX(h.watched_at) as watched_at,
      MAX(h.episode_id) as last_episode_id,
      (SELECT episode_number FROM episodes WHERE id = MAX(h.episode_id)) as episode_number
     FROM watch_history h
     JOIN movies m ON m.id = h.movie_id
     WHERE h.user_id = ?
     GROUP BY m.id, m.title, m.slug, m.poster_url, m.release_year
     ORDER BY watched_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
};

const recordWatchHistory = async ({
  userId,
  movieId,
  episodeId,
  watchSeconds = 0,
  isProgressUpdate = false,
}) => {
  if (episodeId && !isProgressUpdate) {
    await pool.query("UPDATE episodes SET views = views + 1 WHERE id = ?", [
      episodeId,
    ]);
  }
  const [result] = await pool.query(
    `INSERT INTO watch_history (user_id, movie_id, episode_id, watch_seconds)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       movie_id = VALUES(movie_id),
       watch_seconds = GREATEST(watch_seconds, VALUES(watch_seconds)),
       watched_at = CURRENT_TIMESTAMP`,
    [userId, movieId, episodeId || null, watchSeconds || 0]
  );
  return result.insertId;
};

const listDevices = async (userId, limit = 5) => {
  const [rows] = await pool.query(
    `SELECT id, device_name, user_agent, ip_address, last_seen_at
     FROM user_devices
     WHERE user_id = ?
     ORDER BY last_seen_at DESC, id DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
};

const recordDevice = async ({ userId, deviceName, userAgent, ipAddress }) => {
  await pool.query(
    `INSERT INTO user_devices (user_id, device_name, user_agent, ip_address)
     VALUES (?, ?, ?, ?)`,
    [userId, deviceName || null, userAgent || null, ipAddress || null]
  );
};

module.exports = {
  getSettings,
  updateSettings,
  getStats,
  listWatchHistory,
  recordWatchHistory,
  listDevices,
  recordDevice,
};
