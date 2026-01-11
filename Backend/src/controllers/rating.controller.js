const ratingService = require("../services/rating.service");

const getRatingSummary = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.query.movieId, 10);
    if (Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }
    const summary = await ratingService.getRatingSummary(movieId);
    return res.status(200).json({ summary });
  } catch (err) {
    return next(err);
  }
};

const setRating = async (req, res, next) => {
  try {
    const { movieId, rating } = req.body;
    const parsedMovieId = Number.parseInt(movieId, 10);
    const parsedRating = Number.parseInt(rating, 10);

    if (Number.isNaN(parsedMovieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }
    if (Number.isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5 (or 0 to remove)" });
    }

    if (parsedRating === 0) {
      await ratingService.deleteRating({
        userId: req.user.id,
        movieId: parsedMovieId,
      });
    } else {
      await ratingService.upsertRating({
        userId: req.user.id,
        movieId: parsedMovieId,
        rating: parsedRating,
      });
    }

    const summary = await ratingService.getRatingSummary(parsedMovieId);
    return res.status(200).json({ summary });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRatingSummary,
  setRating,
};
