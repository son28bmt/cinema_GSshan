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

const getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await userService.getLeaderboard(limit);
    return res.status(200).json({ users });
  } catch (err) {
    return next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    await userService.updateUserRoleStatus(req.params.id, { role, status });
    const user = await userService.findUserById(req.params.id);
    return res.status(200).json({ message: "Cập nhật thành công.", user });
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(200).json({ message: "Xóa người dùng thành công." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listUsers,
  getLeaderboard,
  getUser,
  updateUser,
  deleteUser,
};
