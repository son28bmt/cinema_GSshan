const express = require("express");
const { getDbHealth } = require("../controllers/db.controller");

const router = express.Router();

router.get("/health", getDbHealth);

module.exports = router;
