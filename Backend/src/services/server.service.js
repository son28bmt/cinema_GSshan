const pool = require("../config/db");

const listServers = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, endpoint_url, load_percent, status, created_at, updated_at
     FROM servers
     ORDER BY created_at DESC`
  );
  return rows;
};

const createServer = async ({ name, endpointUrl, loadPercent, status }) => {
  const [result] = await pool.query(
    `INSERT INTO servers (name, endpoint_url, load_percent, status)
     VALUES (?, ?, ?, ?)`,
    [name, endpointUrl, loadPercent ?? 0, status || "active"]
  );
  const [rows] = await pool.query(
    `SELECT id, name, endpoint_url, load_percent, status, created_at, updated_at
     FROM servers WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
};

module.exports = {
  listServers,
  createServer
};
