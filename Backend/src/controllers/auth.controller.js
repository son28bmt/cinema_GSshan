const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/token");
const userService = require("../services/user.service");
const profileService = require("../services/profile.service");

const crypto = require("crypto");

const { containsReservedWord } = require("../utils/validation");

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Nhập Email và Password" });
    }

    if (containsReservedWord(name)) {
      return res.status(400).json({ message: "Tên không hợp lệ" });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email người dùng đã có" });
    }

    const passwordHash = await hashPassword(password);
    const userId = await userService.createUser({ email, passwordHash, name });
    const user = await userService.findUserById(userId);
    const token = signToken({ id: user.id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Vui lòng nhập đúng Email" });
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    const token = signToken({ id: user.id, role: user.role });
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = (
        req.headers["x-forwarded-for"] ||
        req.ip ||
        ""
      ).toString();
      const deviceName = userAgent ? userAgent.split("(")[0].trim() : "Web";
      await profileService.recordDevice({
        userId: user.id,
        deviceName,
        userAgent,
        ipAddress,
      });
    } catch (err) {
      // Ignore device tracking errors
    }

    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    return next(err);
  }
};

const loginWithGoogle = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify token with Google
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!googleRes.ok) {
      return res.status(401).json({ message: "Invalid Google Token" });
    }

    const googleUser = await googleRes.json();
    const { email, name } = googleUser;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let user = await userService.findUserByEmail(email);

    if (!user) {
      // Create new user
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      const userId = await userService.createUser({
        email,
        passwordHash,
        name: name || "Google User",
      });
      user = await userService.findUserById(userId);
    }

    const jwtToken = signToken({ id: user.id, role: user.role });
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    return res.status(200).json({ user: safeUser, token: jwtToken });
  } catch (err) {
    return next(err);
  }
};

const loginWithFacebook = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify token with Facebook Graph API
    const fbRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
    );

    if (!fbRes.ok) {
      return res.status(401).json({ message: "Invalid Facebook Token" });
    }

    const fbUser = await fbRes.json();
    const { email, name } = fbUser;

    // Facebook might not return email if user didn't grant permission or signed up with phone
    // For simplicity, we require email. In a real app, you might handle phone-only users differently.
    if (!email) {
      return res.status(400).json({
        message: "Facebook account has no email or permission denied",
      });
    }

    let user = await userService.findUserByEmail(email);

    if (!user) {
      // Create new user
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      const userId = await userService.createUser({
        email,
        passwordHash,
        name: name || "Facebook User",
      });
      user = await userService.findUserById(userId);
    }

    const jwtToken = signToken({ id: user.id, role: user.role });
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    return res.status(200).json({ user: safeUser, token: jwtToken });
  } catch (err) {
    return next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  me,
};
