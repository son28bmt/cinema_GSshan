const express = require("express");
const { getGenres, createGenre } = require("../controllers/genre.controller");

const router = express.Router();

router.get("/", getGenres);
router.post("/", createGenre);

module.exports = router;
