const subscriptionService = require("../services/subscription.service");

const getSubscriptionStatus = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.query.movieId, 10);
    if (Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const subscribed = await subscriptionService.isSubscribed(req.user.id, movieId);
    return res.status(200).json({ isSubscribed: subscribed });
  } catch (err) {
    return next(err);
  }
};

const listSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.listSubscriptions(req.user.id);
    return res.status(200).json({ subscriptions });
  } catch (err) {
    return next(err);
  }
};

const addSubscription = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.body.movieId, 10);
    if (Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }

    await subscriptionService.addSubscription(req.user.id, movieId);
    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

const removeSubscription = async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.movieId, 10);
    if (Number.isNaN(movieId)) {
      return res.status(400).json({ message: "movieId is required" });
    }

    await subscriptionService.removeSubscription(req.user.id, movieId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getSubscriptionStatus,
  listSubscriptions,
  addSubscription,
  removeSubscription
};
