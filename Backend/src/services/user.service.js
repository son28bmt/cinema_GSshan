const pool = require("../config/db");

const listUsers = async (limit = 50) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, name, display_name, avatar_url, bio, gender, birth_date,
            email, role, status, created_at
     FROM users
     WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0];
};

const findUserAuthById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, email, password_hash, role, status FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0];
};

const updateUserProfile = async ({
  userId,
  name,
  displayName,
  avatarUrl,
  bio,
  gender,
  birthDate
}) => {
  await pool.query(
    `UPDATE users
     SET name = ?, display_name = ?, avatar_url = ?, bio = ?, gender = ?, birth_date = ?
     WHERE id = ?`,
    [
      name || null,
      displayName || null,
      avatarUrl || null,
      bio || null,
      gender || null,
      birthDate || null,
      userId
    ]
  );
};

const updateUserEmail = async ({ userId, email }) => {
  await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
};

const updateUserPassword = async ({ userId, passwordHash }) => {
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    userId
  ]);
};

const createUser = async ({ email, passwordHash, name }) => {
  const [result] = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, passwordHash, name || null]
  );
  return result.insertId;
};

const getUserStats = async () => {
  const [rows] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(status = 'active') AS active,
      SUM(status = 'disabled') AS disabled
     FROM users`
  );
  return rows[0] || { total: 0, active: 0, disabled: 0 };
};

module.exports = {
  listUsers,
  findUserByEmail,
  findUserById,
  createUser,
  getUserStats,
  findUserAuthById,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword
};
