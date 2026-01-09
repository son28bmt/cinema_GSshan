const express = require("express");
const { getOverview } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/overview", getOverview);

module.exports = router;
