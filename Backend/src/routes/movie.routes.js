const express = require("express");
const { listMovies, listTopRatedMovies, getMovieFilters, getMovieBySlug, createMovie } = require("../controllers/movie.controller");

const router = express.Router();

router.get("/", listMovies);
router.get("/filters", getMovieFilters);
router.get("/ranking", listTopRatedMovies);
router.get("/:slug", getMovieBySlug);
router.post("/", createMovie);

module.exports = router;
