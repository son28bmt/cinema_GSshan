const express = require("express");
const {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
} = require("../controllers/genre.controller");

const router = express.Router();

router.get("/", getGenres);
router.post("/", createGenre);
router.put("/:id", updateGenre);
router.delete("/:id", deleteGenre);

module.exports = router;
