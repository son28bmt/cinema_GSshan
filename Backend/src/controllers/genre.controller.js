const { slugify } = require("../utils/slug");
const genreService = require("../services/genre.service");

const getGenres = async (req, res, next) => {
  try {
    const includeCounts = req.query.includeCounts === "1";
    const genres = includeCounts
      ? await genreService.listGenresWithCounts()
      : await genreService.listGenres();
    return res.status(200).json({ genres });
  } catch (err) {
    return next(err);
  }
};

const createGenre = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      return res.status(400).json({ message: "Slug is invalid" });
    }

    const existing = await genreService.findGenreBySlug(finalSlug);
    if (existing) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    const created = await genreService.createGenre({
      name,
      slug: finalSlug,
      description,
    });

    return res.status(201).json({ genre: created });
  } catch (err) {
    return next(err);
  }
};

const updateGenre = async (req, res, next) => {
  try {
    const genreId = Number.parseInt(req.params.id, 10);
    if (!genreId) {
      return res.status(400).json({ message: "Genre ID is required" });
    }

    const { name, slug, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const finalSlug = slugify(slug || name);
    // Check slug uniqueness if it changed? For now, let's assume service handles DB error or we check it.
    // Ideally we check if slug exists for OTHER genre.
    // For simplicity, we skip explicit slug check here, assuming DB unique constraint or service could handle it.
    // But better to check.

    // Check if new slug conflicts with another genre
    if (finalSlug) {
      const existing = await genreService.findGenreBySlug(finalSlug);
      if (existing && existing.id !== genreId) {
        return res.status(409).json({ message: "Slug already exists" });
      }
    }

    const updated = await genreService.updateGenre(genreId, {
      name,
      slug: finalSlug,
      description,
    });

    if (!updated) {
      return res.status(404).json({ message: "Genre not found" });
    }

    return res.status(200).json({ genre: updated });
  } catch (err) {
    return next(err);
  }
};

const deleteGenre = async (req, res, next) => {
  try {
    const genreId = Number.parseInt(req.params.id, 10);
    if (!genreId) {
      return res.status(400).json({ message: "Genre ID is required" });
    }

    const deleted = await genreService.deleteGenre(genreId);
    if (!deleted) {
      return res.status(404).json({ message: "Genre not found" });
    }

    return res.status(200).json({ message: "Genre deleted successfully" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
};
