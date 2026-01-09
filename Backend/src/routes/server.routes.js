const express = require("express");
const { listServers, createServer } = require("../controllers/server.controller");

const router = express.Router();

router.get("/", listServers);
router.post("/", createServer);

module.exports = router;
