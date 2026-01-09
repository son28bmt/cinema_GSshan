const express = require("express");
const { listFavorites, addFavorite, removeFavorite } = require("../controllers/favorite.controller");
const requireAuth = require("../middlewares/auth");

const router = express.Router();

router.get("/", requireAuth, listFavorites);
router.post("/", requireAuth, addFavorite);
router.delete("/:movieId", requireAuth, removeFavorite);

module.exports = router;
