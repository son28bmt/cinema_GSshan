const express = require("express");
const { listUsers } = require("../controllers/user.controller");

const router = express.Router();

router.get("/", listUsers);

module.exports = router;
