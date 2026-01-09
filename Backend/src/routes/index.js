const express = require("express");
const healthRoutes = require("./health.routes");
const dbRoutes = require("./db.routes");
const authRoutes = require("./auth.routes");
const genreRoutes = require("./genre.routes");
const movieRoutes = require("./movie.routes");
const episodeRoutes = require("./episode.routes");
const serverRoutes = require("./server.routes");
const userRoutes = require("./user.routes");
const commentRoutes = require("./comment.routes");
const ratingRoutes = require("./rating.routes");
const favoriteRoutes = require("./favorite.routes");
const adminRoutes = require("./admin.routes");
const profileRoutes = require("./profile.routes");
const subscriptionRoutes = require("./subscription.routes");
const notificationRoutes = require("./notification.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/db", dbRoutes);
router.use("/auth", authRoutes);
router.use("/genres", genreRoutes);
router.use("/movies", movieRoutes);
router.use("/episodes", episodeRoutes);
router.use("/servers", serverRoutes);
router.use("/users", userRoutes);
router.use("/comments", commentRoutes);
router.use("/ratings", ratingRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/admin", adminRoutes);
router.use("/profile", profileRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
