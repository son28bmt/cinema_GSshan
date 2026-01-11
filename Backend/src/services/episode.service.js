const pool = require("../config/db");

const listEpisodes = async (movieId) => {
  const [rows] = await pool.query(
    `SELECT
      id,
      episode_number,
      title,
      description,
      video_url,
      thumbnail_url,
      status,
      views,
      is_premiere,
      live_start_at,
      released_at,
      created_at,
      updated_at
    FROM episodes
    WHERE movie_id = ?
    ORDER BY episode_number ASC, created_at DESC`,
    [movieId]
  );
  return rows;
};

const listLatestEpisodes = async (limit = 5) => {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.movie_id,
      e.episode_number,
      e.title,
      e.thumbnail_url,
      e.created_at,
      e.released_at,
      e.status,
      e.is_premiere,
      e.live_start_at,
      m.title AS movie_title,
      m.slug AS movie_slug,
      m.poster_url AS movie_poster,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres
     FROM episodes e
     JOIN movies m ON m.id = e.movie_id
     ORDER BY e.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const listScheduleEpisodes = async ({ date, limit = 4 }) => {
  if (date) {
    const [rows] = await pool.query(
      `SELECT
        e.id,
        e.movie_id,
        e.episode_number,
        e.title,
        e.thumbnail_url,
        e.created_at,
        e.released_at,
        e.status,
        e.is_premiere,
        e.live_start_at,
        m.title AS movie_title,
        m.slug AS movie_slug,
        m.poster_url AS movie_poster,
        (
          SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
          FROM movie_genres mg
          JOIN genres g ON g.id = mg.genre_id
          WHERE mg.movie_id = m.id
        ) AS genres
       FROM episodes e
       JOIN movies m ON m.id = e.movie_id
       WHERE DATE(e.released_at) = ?
       ORDER BY e.released_at DESC, e.created_at DESC
       LIMIT ?`,
      [date, limit]
    );
    return rows;
  }

  return listLatestEpisodes(limit);
};

const getEpisodeById = async (episodeId) => {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.movie_id,
      e.episode_number,
      e.title,
      e.description,
      e.video_url,
      e.thumbnail_url,
      e.status,
      e.views,
      e.is_premiere,
      e.live_start_at,
      e.released_at,
      e.created_at,
      e.updated_at,
      m.title AS movie_title,
      m.slug AS movie_slug,
      m.poster_url AS movie_poster,
      m.release_year,
      m.country,
      m.description AS movie_description,
      m.status AS movie_status,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres
    FROM episodes e
    JOIN movies m ON m.id = e.movie_id
    WHERE e.id = ?
    LIMIT 1`,
    [episodeId]
  );

  const episode = rows[0];
  if (episode) {
    const isPremiere = Boolean(episode.is_premiere);
    const liveStartAt = episode.live_start_at
      ? new Date(episode.live_start_at).getTime()
      : null;
    const now = Date.now();

    // Mask video_url if it's a premiere and time hasn't arrived
    if (isPremiere && liveStartAt && now < liveStartAt) {
      episode.video_url = null;
    }
  }

  return episode;
};

const createEpisode = async ({
  movieId,
  episodeNumber,
  title,
  description,
  videoUrl,
  thumbnailUrl,
  status,
  releasedAt,
  isPremiere,
  liveStartAt,
}) => {
  const [result] = await pool.query(
    `INSERT INTO episodes
      (movie_id, episode_number, title, description, video_url, thumbnail_url, status, released_at, is_premiere, live_start_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movieId,
      episodeNumber,
      title || null,
      description || null,
      videoUrl || null,
      thumbnailUrl || null,
      status,
      releasedAt || null,
      isPremiere ? 1 : 0,
      liveStartAt || null,
    ]
  );
  return result.insertId;
};

const updateEpisode = async (
  episodeId,
  {
    movieId,
    episodeNumber,
    title,
    description,
    videoUrl,
    thumbnailUrl,
    status,
    releasedAt,
    isPremiere,
    liveStartAt,
  }
) => {
  const [result] = await pool.query(
    `UPDATE episodes
     SET
       movie_id = ?,
       episode_number = ?,
       title = ?,
       description = ?,
       video_url = ?,
       thumbnail_url = ?,
       status = ?,
       released_at = ?,
       is_premiere = ?,
       live_start_at = ?,
       updated_at = NOW()
     WHERE id = ?`,
    [
      movieId,
      episodeNumber,
      title || null,
      description || null,
      videoUrl || null,
      thumbnailUrl || null,
      status,
      releasedAt || null,
      isPremiere ? 1 : 0,
      liveStartAt || null,
      episodeId,
    ]
  );
  return result.affectedRows > 0;
};

const deleteEpisode = async (episodeId) => {
  // Manual cascade delete because FKs might not be set to CASCADE
  await pool.query("DELETE FROM comments WHERE episode_id = ?", [episodeId]);
  await pool.query("DELETE FROM watch_history WHERE episode_id = ?", [
    episodeId,
  ]);
  await pool.query(
    "DELETE FROM user_notifications WHERE notification_id IN (SELECT id FROM notifications WHERE type = 'episode_release' AND message LIKE ?)",
    [`%link_to_episode_${episodeId}%`]
  ); // This is tricky without a direct link, but standard Cascade usually handles notifications if they are linked.
  // Simplify: just handle direct FKs first.

  await pool.query("DELETE FROM episodes WHERE id = ?", [episodeId]);
  return true;
};

const incrementViews = async (episodeId) => {
  await pool.query("UPDATE episodes SET views = views + 1 WHERE id = ?", [
    episodeId,
  ]);
};

module.exports = {
  listEpisodes,
  listLatestEpisodes,
  listScheduleEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  incrementViews,
};
