const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const env = process.env.NODE_ENV || "development";
const port = Number.parseInt(process.env.PORT || "4000", 10);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const jwtSecret = process.env.JWT_SECRET || "change-me";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

module.exports = {
  env,
  port,
  corsOrigin,
  jwtSecret,
  jwtExpiresIn
};
