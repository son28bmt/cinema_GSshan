const userService = require("../services/user.service");
const favoriteService = require("../services/favorite.service");
const profileService = require("../services/profile.service");
const { comparePassword, hashPassword } = require("../utils/password");

const getProfileSummary = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [stats, favorites, history, settings] = await Promise.all([
      profileService.getStats(req.user.id),
      favoriteService.listFavorites(req.user.id),
      profileService.listWatchHistory(req.user.id, 8),
      profileService.getSettings(req.user.id)
    ]);

    return res.status(200).json({ user, stats, favorites, history, settings });
  } catch (err) {
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, displayName, avatarUrl, bio, gender, birthDate } = req.body;

    await userService.updateUserProfile({
      userId: req.user.id,
      name,
      displayName,
      avatarUrl,
      bio,
      gender,
      birthDate
    });

    const user = await userService.findUserById(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
};

const updateEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const authUser = await userService.findUserAuthById(req.user.id);
    if (!authUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await comparePassword(password, authUser.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await userService.updateUserEmail({ userId: req.user.id, email });
    const user = await userService.findUserById(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { notifyNewMovies, notifyNewEpisodes, marketingEmails } = req.body;

    const settings = await profileService.updateSettings(req.user.id, {
      notifyNewMovies,
      notifyNewEpisodes,
      marketingEmails
    });

    return res.status(200).json({ settings });
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const authUser = await userService.findUserAuthById(req.user.id);
    if (!authUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await comparePassword(currentPassword, authUser.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const passwordHash = await hashPassword(newPassword);
    await userService.updateUserPassword({ userId: req.user.id, passwordHash });
    return res.status(200).json({ message: "Password updated" });
  } catch (err) {
    return next(err);
  }
};

const listDevices = async (req, res, next) => {
  try {
    const devices = await profileService.listDevices(req.user.id);
    return res.status(200).json({ devices });
  } catch (err) {
    return next(err);
  }
};

const recordWatchHistory = async (req, res, next) => {
  try {
    const { movieId, episodeId, watchSeconds } = req.body;
    const parsedMovieId = Number.parseInt(movieId, 10);

    if (Number.isNaN(parsedMovieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const parsedEpisodeId = episodeId ? Number.parseInt(episodeId, 10) : null;
    const parsedWatchSeconds = watchSeconds ? Number.parseInt(watchSeconds, 10) : 0;

    await profileService.recordWatchHistory({
      userId: req.user.id,
      movieId: parsedMovieId,
      episodeId: parsedEpisodeId,
      watchSeconds: parsedWatchSeconds
    });

    return res.status(201).json({ message: "Recorded" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfileSummary,
  updateProfile,
  updateEmail,
  updateSettings,
  changePassword,
  listDevices,
  recordWatchHistory
};
