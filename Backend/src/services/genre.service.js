const pool = require("../config/db");

const listGenres = async () => {
  const [rows] = await pool.query(
    "SELECT id, name, slug, description, created_at, updated_at FROM genres ORDER BY name"
  );
  return rows;
};

const listGenresWithCounts = async () => {
  const [rows] = await pool.query(
    `SELECT
      g.id,
      g.name,
      g.slug,
      g.description,
      COUNT(DISTINCT mg.movie_id) AS movie_count,
      g.created_at,
      g.updated_at
     FROM genres g
     LEFT JOIN movie_genres mg ON mg.genre_id = g.id
     GROUP BY g.id, g.name, g.slug, g.description, g.created_at, g.updated_at
     ORDER BY g.name`
  );
  return rows;
};

const findGenreBySlug = async (slug) => {
  const [rows] = await pool.query(
    "SELECT id FROM genres WHERE slug = ? LIMIT 1",
    [slug]
  );
  return rows[0];
};

const createGenre = async ({ name, slug, description }) => {
  const [result] = await pool.query(
    "INSERT INTO genres (name, slug, description) VALUES (?, ?, ?)",
    [name, slug, description || null]
  );
  const [rows] = await pool.query(
    "SELECT id, name, slug, description, created_at, updated_at FROM genres WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
};

const updateGenre = async (id, { name, slug, description }) => {
  const [result] = await pool.query(
    "UPDATE genres SET name = ?, slug = ?, description = ? WHERE id = ?",
    [name, slug, description || null, id]
  );
  if (result.affectedRows === 0) return null;

  const [rows] = await pool.query(
    "SELECT id, name, slug, description, created_at, updated_at FROM genres WHERE id = ?",
    [id]
  );
  return rows[0];
};

const deleteGenre = async (id) => {
  const [result] = await pool.query("DELETE FROM genres WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

module.exports = {
  listGenres,
  listGenresWithCounts,
  findGenreBySlug,
  createGenre,
  updateGenre,
  deleteGenre,
};
