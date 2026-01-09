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
  return rows[0];
};

const createEpisode = async ({
  movieId,
  episodeNumber,
  title,
  description,
  videoUrl,
  thumbnailUrl,
  status,
  releasedAt
}) => {
  const [result] = await pool.query(
    `INSERT INTO episodes
      (movie_id, episode_number, title, description, video_url, thumbnail_url, status, released_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movieId,
      episodeNumber,
      title || null,
      description || null,
      videoUrl || null,
      thumbnailUrl || null,
      status,
      releasedAt || null
    ]
  );
  return result.insertId;
};

module.exports = {
  listEpisodes,
  listLatestEpisodes,
  listScheduleEpisodes,
  getEpisodeById,
  createEpisode
};
