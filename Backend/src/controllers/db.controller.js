const pool = require("../config/db");

const getDbHealth = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.status(200).json({ status: "ok", db: rows[0]?.ok === 1 });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDbHealth
};
