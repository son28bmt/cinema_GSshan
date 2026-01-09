require("../src/config/env");

const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

const run = async () => {
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [ADMIN_EMAIL]
    );

    if (rows.length > 0) {
      await pool.query(
        "UPDATE users SET password_hash = ?, name = ?, role = 'admin', status = 'active' WHERE id = ?",
        [passwordHash, ADMIN_NAME, rows[0].id]
      );
      console.log("[admin] updated admin user");
    } else {
      await pool.query(
        "INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, 'admin', 'active')",
        [ADMIN_EMAIL, passwordHash, ADMIN_NAME]
      );
      console.log("[admin] created admin user");
    }
  } catch (err) {
    console.error("[admin] create failed", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
