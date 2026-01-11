const episodeService = require("../services/episode.service");
const notificationService = require("../services/notification.service");

const listEpisodes = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.query.movieId, 10);
    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const episodes = await episodeService.listEpisodes(movieId);
    return res.status(200).json({ episodes });
  } catch (err) {
    return next(err);
  }
};

const listLatestEpisodes = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "5", 10);
    const episodes = await episodeService.listLatestEpisodes(
      Number.isNaN(limit) ? 5 : limit
    );
    return res.status(200).json({ episodes });
  } catch (err) {
    return next(err);
  }
};

const listScheduleEpisodes = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "4", 10);
    const date = req.query.date || null;
    const episodes = await episodeService.listScheduleEpisodes({
      date,
      limit: Number.isNaN(limit) ? 4 : limit,
    });
    return res.status(200).json({ episodes });
  } catch (err) {
    return next(err);
  }
};

const getEpisodeById = async (req, res, next) => {
  try {
    const episodeId = Number.parseInt(req.params.id, 10);
    if (!episodeId) {
      return res.status(400).json({ message: "episode id is required" });
    }

    const episode = await episodeService.getEpisodeById(episodeId);
    if (!episode) {
      return res.status(404).json({ message: "Episode not found" });
    }

    return res.status(200).json({ episode });
  } catch (err) {
    return next(err);
  }
};

const createEpisode = async (req, res, next) => {
  try {
    const {
      movieId,
      episodeNumber,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      status,
      releasedAt,
      isPremiere,
      liveStartAt,
    } = req.body;

    const numericMovieId = Number.parseInt(movieId, 10);
    const numericEpisodeNumber = Number.parseInt(episodeNumber, 10);

    if (!numericMovieId) {
      return res.status(400).json({ message: "movieId is required" });
    }
    if (!numericEpisodeNumber || numericEpisodeNumber < 1) {
      return res.status(400).json({ message: "episodeNumber is invalid" });
    }

    const episodeId = await episodeService.createEpisode({
      movieId: numericMovieId,
      episodeNumber: numericEpisodeNumber,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      status: status === "published" ? "published" : "draft",
      releasedAt,
      // Nếu có liveStartAt thì luôn coi là premiere để khóa video tới giờ phát
      isPremiere:
        isPremiere === true ||
        isPremiere === "true" ||
        isPremiere === 1 ||
        isPremiere === "1" ||
        Boolean(liveStartAt),
      liveStartAt,
    });

    if (status === "published") {
      notificationService
        .notifyEpisodeRelease(numericMovieId, title, numericEpisodeNumber)
        .catch((err) => console.error("Notification trigger failed:", err));
    }

    return res.status(201).json({ id: episodeId });
  } catch (err) {
    return next(err);
  }
};

const updateEpisode = async (req, res, next) => {
  try {
    const episodeId = Number.parseInt(req.params.id, 10);
    if (!episodeId) {
      return res.status(400).json({ message: "episode id is required" });
    }

    const {
      movieId,
      episodeNumber,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      status,
      releasedAt,
      isPremiere,
      liveStartAt,
    } = req.body;

    const numericMovieId = Number.parseInt(movieId, 10);
    const numericEpisodeNumber = Number.parseInt(episodeNumber, 10);

    if (!numericMovieId) {
      return res.status(400).json({ message: "movieId is required" });
    }
    if (!numericEpisodeNumber || numericEpisodeNumber < 1) {
      return res.status(400).json({ message: "episodeNumber is invalid" });
    }

    const updated = await episodeService.updateEpisode(episodeId, {
      movieId: numericMovieId,
      episodeNumber: numericEpisodeNumber,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      status: status === "published" ? "published" : "draft",
      releasedAt,
      isPremiere:
        isPremiere === true ||
        isPremiere === "true" ||
        isPremiere === 1 ||
        isPremiere === "1" ||
        Boolean(liveStartAt),
      liveStartAt,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Episode not found or no changes made" });
    }

    if (status === "published") {
      console.log(
        `[Controller] Episode updated to published. Triggering notification for MovieID=${numericMovieId}`
      );
      notificationService
        .notifyEpisodeRelease(numericMovieId, title, numericEpisodeNumber)
        .catch((err) => console.error("Notification trigger failed:", err));
    }

    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    return next(err);
  }
};

const deleteEpisode = async (req, res, next) => {
  try {
    const episodeId = Number.parseInt(req.params.id, 10);
    if (!episodeId) {
      return res.status(400).json({ message: "episode id is required" });
    }

    const deleted = await episodeService.deleteEpisode(episodeId);
    if (!deleted) {
      return res.status(404).json({ message: "Episode not found" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listEpisodes,
  listLatestEpisodes,
  listScheduleEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
};
