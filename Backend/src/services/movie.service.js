const pool = require("../config/db");

const findMovieBySlug = async (slug) => {
  const [rows] = await pool.query(
    "SELECT id FROM movies WHERE slug = ? LIMIT 1",
    [slug]
  );
  return rows[0];
};

const getMovieBySlug = async (slug) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.original_title,
      m.studio,
      m.total_episodes,
      m.slug,
      m.release_year,
      m.poster_url,
      m.backdrop_url,
      m.trailer_url,
      m.status,
      m.description,
      m.country,
      COALESCE(view_stats.total_views, 0) AS views,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres
    FROM movies m
    LEFT JOIN (
      SELECT movie_id, SUM(views) AS total_views
      FROM episodes
      GROUP BY movie_id
    ) view_stats ON view_stats.movie_id = m.id
    WHERE m.slug = ?
    LIMIT 1`,
    [slug]
  );
  return rows[0];
};

const getMovieById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.original_title,
      m.studio,
      m.total_episodes,
      m.slug,
      m.release_year,
      m.poster_url,
      m.backdrop_url,
      m.trailer_url,
      m.status,
      m.description,
      m.country,
      COALESCE(view_stats.total_views, 0) AS views,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres
    FROM movies m
    LEFT JOIN (
      SELECT movie_id, SUM(views) AS total_views
      FROM episodes
      GROUP BY movie_id
    ) view_stats ON view_stats.movie_id = m.id
    WHERE m.id = ?
    LIMIT 1`,
    [id]
  );
  return rows[0];
};

const createMovie = async ({
  title,
  originalTitle,
  slug,
  description,
  status,
  country,
  releaseYear,
  trailerUrl,
  backdropUrl,
  posterUrl,
  genreIds,
  studio,
  totalEpisodes,
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO movies (title, original_title, studio, total_episodes, slug, description, status, country, release_year, trailer_url, backdrop_url, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        originalTitle || null,
        studio || null,
        totalEpisodes || null,
        slug,
        description || null,
        status,
        country || null,
        releaseYear || null,
        trailerUrl || null,
        backdropUrl || null,
        posterUrl || null,
      ]
    );

    const movieId = result.insertId;

    if (Array.isArray(genreIds) && genreIds.length > 0) {
      const values = genreIds.map((genreId) => [movieId, genreId]);
      await connection.query(
        "INSERT INTO movie_genres (movie_id, genre_id) VALUES ?",
        [values]
      );
    }

    await connection.commit();
    return movieId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const updateMovie = async (
  id,
  {
    title,
    originalTitle,
    slug,
    description,
    status,
    country,
    releaseYear,
    trailerUrl,
    backdropUrl,
    posterUrl,
    genreIds,
    studio,
    totalEpisodes,
  }
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE movies 
       SET 
         title = ?, 
         original_title = ?, 
         studio = ?, 
         total_episodes = ?, 
         slug = ?, 
         description = ?, 
         status = ?, 
         country = ?, 
         release_year = ?, 
         trailer_url = ?, 
         backdrop_url = ?, 
         poster_url = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        originalTitle || null,
        studio || null,
        totalEpisodes,
        slug,
        description || null,
        status,
        country || null,
        releaseYear || null,
        trailerUrl || null,
        backdropUrl || null,
        posterUrl || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    if (Array.isArray(genreIds)) {
      await connection.query("DELETE FROM movie_genres WHERE movie_id = ?", [
        id,
      ]);
      if (genreIds.length > 0) {
        const values = genreIds.map((genreId) => [id, genreId]);
        await connection.query(
          "INSERT INTO movie_genres (movie_id, genre_id) VALUES ?",
          [values]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const deleteMovie = async (id) => {
  const [result] = await pool.query("DELETE FROM movies WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

const listMovies = async (options = {}) => {
  const normalizedOptions =
    typeof options === "number" ? { limit: options } : options;
  const {
    limit = 6,
    page = 1,
    sort = "latest",
    genre,
    year,
    status,
    country,
    q,
  } = normalizedOptions;

  const filters = [];
  const params = [];

  if (genre) {
    filters.push(
      `EXISTS (
        SELECT 1
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id AND g.slug = ?
      )`
    );
    params.push(genre);
  }

  if (status) {
    filters.push("m.status = ?");
    params.push(status);
  }

  if (year) {
    filters.push("m.release_year = ?");
    params.push(year);
  }

  if (country) {
    filters.push("m.country = ?");
    params.push(country);
  }

  if (q) {
    const like = `%${q}%`;
    filters.push(
      "(m.title LIKE ? OR m.original_title LIKE ? OR m.slug LIKE ?)"
    );
    params.push(like, like, like);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sortMap = {
    views: "COALESCE(view_stats.total_views, 0) DESC",
    rating:
      "COALESCE(rating_stats.avg_rating, 0) DESC, COALESCE(rating_stats.rating_count, 0) DESC",
    favorites: "COALESCE(favorite_stats.favorite_count, 0) DESC",
    latest: "m.created_at DESC",
  };

  const sortClause = sortMap[sort] || sortMap.latest;
  const offset = Math.max(0, (page - 1) * limit);

  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.original_title,
      m.slug,
      m.release_year,
      m.poster_url,
      m.studio,
      m.total_episodes,
      m.status,
      m.description,
      m.country,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres,
      COALESCE(rating_stats.avg_rating, 0) AS rating,
      COALESCE(rating_stats.rating_count, 0) AS rating_count,
      COALESCE(view_stats.total_views, 0) AS views,
      COALESCE(favorite_stats.favorite_count, 0) AS favorite_count
    FROM movies m
    LEFT JOIN (
      SELECT movie_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count
      FROM ratings
      GROUP BY movie_id
    ) rating_stats ON rating_stats.movie_id = m.id
    LEFT JOIN (
      SELECT movie_id, SUM(views) AS total_views
      FROM episodes
      GROUP BY movie_id
    ) view_stats ON view_stats.movie_id = m.id
    LEFT JOIN (
      SELECT movie_id, COUNT(*) AS favorite_count
      FROM favorites
      GROUP BY movie_id
    ) favorite_stats ON favorite_stats.movie_id = m.id
    ${whereClause}
    ORDER BY ${sortClause}, m.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM movies m ${whereClause}`,
    params
  );

  return {
    movies: rows,
    total: countRows[0]?.total || 0,
  };
};

const getMovieFilters = async () => {
  const [yearRows] = await pool.query(
    `SELECT DISTINCT release_year
     FROM movies
     WHERE release_year IS NOT NULL
     ORDER BY release_year DESC`
  );
  const [countryRows] = await pool.query(
    `SELECT DISTINCT country
     FROM movies
     WHERE country IS NOT NULL AND country <> ''
     ORDER BY country ASC`
  );

  return {
    years: yearRows.map((row) => row.release_year),
    countries: countryRows.map((row) => row.country),
  };
};

const listTopRatedMovies = async (limit = 3) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.slug,
      m.release_year,
      m.poster_url,
      (
        SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
        FROM movie_genres mg
        JOIN genres g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
      ) AS genres,
      COALESCE(AVG(r.rating), 0) AS rating,
      COUNT(r.rating) AS rating_count
     FROM movies m
     LEFT JOIN ratings r ON r.movie_id = m.id
     GROUP BY m.id, m.title, m.slug, m.release_year, m.poster_url
     ORDER BY rating DESC, rating_count DESC, m.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

module.exports = {
  findMovieBySlug,
  getMovieBySlug,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  listMovies,
  listTopRatedMovies,
  getMovieFilters,
};
