const pool = require("../config/db");

const listUsers = async (limit = 50) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status, created_at, xp
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
            email, role, status, created_at, xp
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
  birthDate,
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
      userId,
    ]
  );
};

const updateUserEmail = async ({ userId, email }) => {
  await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
};

const updateUserPassword = async ({ userId, passwordHash }) => {
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
    passwordHash,
    userId,
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

const updateUserXp = async (userId, points) => {
  await pool.query("UPDATE users SET xp = xp + ? WHERE id = ?", [
    points,
    userId,
  ]);
};

const getLeaderboard = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT id, name, display_name, avatar_url, xp, role
     FROM users
     ORDER BY xp DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

const deleteUser = async (userId) => {
  await pool.query("DELETE FROM users WHERE id = ?", [userId]);
};

const updateUserRoleStatus = async (userId, { role, status }) => {
  const updates = [];
  const values = [];

  if (role) {
    updates.push("role = ?");
    values.push(role);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }

  if (updates.length === 0) return;

  values.push(userId);
  await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
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
  updateUserPassword,
  updateUserXp,
  getLeaderboard,
  deleteUser,
  updateUserRoleStatus,
};
