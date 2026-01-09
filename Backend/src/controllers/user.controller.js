const userService = require("../services/user.service");

const listUsers = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit || "50", 10);
    const users = await userService.listUsers(Number.isNaN(limit) ? 50 : limit);
    const stats = await userService.getUserStats();
    return res.status(200).json({ users, stats });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listUsers
};
