const favoriteService = require("../services/favorite.service");

const listFavorites = async (req, res, next) => {
  try {
    const movieId = req.query.movieId ? Number.parseInt(req.query.movieId, 10) : null;
    if (movieId && Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is invalid" });
    }

    if (movieId) {
      const isFavorite = await favoriteService.isFavorite(req.user.id, movieId);
      return res.status(200).json({ isFavorite });
    }

    const favorites = await favoriteService.listFavorites(req.user.id);
    return res.status(200).json({ favorites });
  } catch (err) {
    return next(err);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    const parsedMovieId = Number.parseInt(movieId, 10);

    if (Number.isNaN(parsedMovieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }

    await favoriteService.addFavorite(req.user.id, parsedMovieId);
    return res.status(201).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.movieId, 10);
    if (Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is invalid" });
    }

    await favoriteService.removeFavorite(req.user.id, movieId);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite
};
