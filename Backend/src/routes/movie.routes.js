const express = require("express");
const {
  listMovies,
  listTopRatedMovies,
  getMovieFilters,
  getMovieBySlug,
  createMovie,
  getMovieById,
  updateMovie,
  deleteMovie,
} = require("../controllers/movie.controller");

const router = express.Router();

router.get("/", listMovies);
router.get("/filters", getMovieFilters);
router.get("/ranking", listTopRatedMovies);
router.get("/id/:id", getMovieById);
router.get("/:slug", getMovieBySlug);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

module.exports = router;
