const commentService = require("../services/comment.service");
const userService = require("../services/user.service");
const episodeService = require("../services/episode.service");

const listComments = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "20", 10);
    const movieId = req.query.movieId
      ? Number.parseInt(req.query.movieId, 10)
      : null;
    const episodeId = req.query.episodeId
      ? Number.parseInt(req.query.episodeId, 10)
      : null;
    const status = req.query.status || null;

    const comments = await commentService.listComments({
      limit: Number.isNaN(limit) ? 20 : limit,
      movieId: Number.isNaN(movieId) ? null : movieId,
      episodeId: Number.isNaN(episodeId) ? null : episodeId,
      status,
    });

    if (movieId || episodeId || status) {
      return res.status(200).json({ comments });
    }

    const stats = await commentService.getCommentStats();
    return res.status(200).json({ comments, stats });
  } catch (err) {
    return next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { content, movieId, episodeId, parentId } = req.body;
    const parsedMovieId = movieId ? Number.parseInt(movieId, 10) : null;
    const parsedEpisodeId = episodeId ? Number.parseInt(episodeId, 10) : null;
    const parsedParentId = parentId ? Number.parseInt(parentId, 10) : null;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    // General comments don't need movieId or episodeId

    if (parsedParentId) {
      const parent = await commentService.findCommentById(parsedParentId);
      if (!parent) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      const sameMovie = parsedMovieId && parent.movie_id === parsedMovieId;
      const sameEpisode =
        parsedEpisodeId && parent.episode_id === parsedEpisodeId;
      if (!sameMovie && !sameEpisode) {
        return res.status(400).json({ message: "Parent comment mismatch" });
      }
    }

    const user = await userService.findUserById(req.user.id);
    const authorName =
      user?.name || (user?.email ? user.email.split("@")[0] : "User");

    // Check for XP Eligibility BEFORE creating the comment (to exclude the one we are about to create)
    let shouldAwardXp = false;

    if (parsedMovieId || parsedEpisodeId) {
      // Logic: One time per movie/episode
      const hasCommented = await commentService.hasCommentedOn(
        req.user.id,
        parsedMovieId,
        parsedEpisodeId
      );
      if (!hasCommented) {
        shouldAwardXp = true;
      }
    } else {
      // Logic: General comment -> Cooldown 10 minutes
      const lastCommentTime = await commentService.getLastGeneralCommentTime(
        req.user.id
      );
      if (!lastCommentTime) {
        shouldAwardXp = true;
      } else {
        const diffMinutes = (new Date() - lastCommentTime) / 1000 / 60;
        if (diffMinutes >= 10) {
          // 10 minutes cooldown
          shouldAwardXp = true;
        }
      }
    }

    const comment = await commentService.createComment({
      userId: req.user.id,
      movieId: parsedMovieId,
      episodeId: parsedEpisodeId,
      parentId: parsedParentId,
      content: content.trim(),
      authorName,
      authorIp: req.ip,
    });

    // Award 15 XP if eligible
    if (shouldAwardXp) {
      await userService.updateUserXp(req.user.id, 15);
    }

    return res.status(201).json({ comment });
  } catch (err) {
    return next(err);
  }
};

const reportComment = async (req, res, next) => {
  try {
    const commentId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const updated = await commentService.reportComment({
      commentId,
      reason: reason.trim().slice(0, 200),
    });

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json({ comment: updated });
  } catch (err) {
    return next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const commentId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const user = await userService.findUserById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const removed = await commentService.deleteComment(commentId);
    if (!removed) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listComments,
  createComment,
  reportComment,
  deleteComment,
};
