require("./env");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const sslCaPath = process.env.DB_SSL_CA_PATH;
const sslCaRaw = process.env.DB_SSL_CA;
const sslCa = sslCaRaw ? sslCaRaw.replace(/\\n/g, "\n") : "";
const ssl =
  sslCaPath || sslCa
    ? { ca: sslCaPath ? fs.readFileSync(path.resolve(sslCaPath), "utf8") : sslCa }
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cinema",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl
});

module.exports = pool;
