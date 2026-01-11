const { slugify } = require("../utils/slug");
const movieService = require("../services/movie.service");

const listMovies = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "6", 10);
    const page = Number.parseInt(req.query.page || "1", 10);
    const sort = req.query.sort || "latest";
    const genre = req.query.genre || null;
    const status = req.query.status || null;
    const country = req.query.country || null;
    const year = req.query.year ? Number.parseInt(req.query.year, 10) : null;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const { movies, total } = await movieService.listMovies({
      limit: Number.isNaN(limit) ? 6 : limit,
      page: Number.isNaN(page) ? 1 : page,
      sort,
      genre,
      status: status === "all" ? null : status,
      country: country === "all" ? null : country,
      year: Number.isNaN(year) ? null : year,
      q: q || null,
    });

    const normalized = movies.map((movie) => ({
      ...movie,
      rating: Number(movie.rating || 0),
      rating_count: Number(movie.rating_count || 0),
      views: Number(movie.views || 0),
      favorite_count: Number(movie.favorite_count || 0),
    }));

    const totalPages = Math.max(
      1,
      Math.ceil(total / (Number.isNaN(limit) ? 6 : limit))
    );
    return res.status(200).json({
      movies: normalized,
      pagination: {
        page: Number.isNaN(page) ? 1 : page,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const listTopRatedMovies = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "3", 10);
    const movies = await movieService.listTopRatedMovies(
      Number.isNaN(limit) ? 3 : limit
    );
    const normalized = movies.map((movie) => ({
      ...movie,
      rating: Number(movie.rating || 0),
      rating_count: Number(movie.rating_count || 0),
    }));
    return res.status(200).json({ movies: normalized });
  } catch (err) {
    return next(err);
  }
};

const getMovieBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const movie = await movieService.getMovieBySlug(slug);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.status(200).json({ movie });
  } catch (err) {
    return next(err);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.id, 10);
    if (!movieId) {
      return res.status(400).json({ message: "movie id is required" });
    }
    const movie = await movieService.getMovieById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    return res.status(200).json({ movie });
  } catch (err) {
    return next(err);
  }
};

const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      originalTitle,
      slug,
      description,
      status,
      country,
      releaseYear,
      trailerUrl,
      backdropUrl,
      posterUrl,
      genreIds,
      studio,
      totalEpisodes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const finalSlug = slugify(slug || title);
    if (!finalSlug) {
      return res.status(400).json({ message: "Slug is invalid" });
    }

    const existing = await movieService.findMovieBySlug(finalSlug);
    if (existing) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const movieId = await movieService.createMovie({
      title,
      originalTitle,
      slug: finalSlug,
      description,
      status: status || "ongoing",
      country,
      releaseYear,
      trailerUrl,
      backdropUrl,
      posterUrl,
      genreIds,
      studio,
      totalEpisodes: Number.isFinite(Number(totalEpisodes))
        ? Number.parseInt(totalEpisodes, 10)
        : undefined,
    });

    return res.status(201).json({ id: movieId });
  } catch (err) {
    return next(err);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.id, 10);
    if (!movieId) {
      return res.status(400).json({ message: "Movie ID is required" });
    }

    const {
      title,
      originalTitle,
      slug,
      description,
      status,
      country,
      releaseYear,
      trailerUrl,
      backdropUrl,
      posterUrl,
      genreIds,
      studio,
      totalEpisodes,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const finalSlug = slugify(slug || title);
    if (!finalSlug) {
      return res.status(400).json({ message: "Slug is invalid" });
    }

    // Check slug conflict
    const existing = await movieService.findMovieBySlug(finalSlug);
    if (existing && existing.id !== movieId) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const updated = await movieService.updateMovie(movieId, {
      title,
      originalTitle,
      slug: finalSlug,
      description,
      status: status || "ongoing",
      country,
      releaseYear,
      trailerUrl,
      backdropUrl,
      posterUrl,
      genreIds,
      studio,
      totalEpisodes: Number.isFinite(Number(totalEpisodes))
        ? Number.parseInt(totalEpisodes, 10)
        : undefined,
    });

    if (!updated) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(200).json({ message: "Movie updated successfully" });
  } catch (err) {
    return next(err);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.id, 10);
    if (!movieId) {
      return res.status(400).json({ message: "Movie ID is required" });
    }

    const deleted = await movieService.deleteMovie(movieId);
    if (!deleted) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(200).json({ message: "Movie deleted successfully" });
  } catch (err) {
    return next(err);
  }
};

const getMovieFilters = async (req, res, next) => {
  try {
    const filters = await movieService.getMovieFilters();
    return res.status(200).json(filters);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listMovies,
  listTopRatedMovies,
  getMovieFilters,
  getMovieById,
  getMovieBySlug,
  createMovie,
  updateMovie,
  deleteMovie,
};
