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
      description
    });

    return res.status(201).json({ genre: created });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getGenres,
  createGenre
};
