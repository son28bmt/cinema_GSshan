const RESERVED_NAMES = [
  "admin",
  "administrator",
  "quản trị viên",
  "quan tri vien",
  "mod",
  "moderator",
  "superadmin",
  "root",
  "system",
  "hệ thống",
];

const containsReservedWord = (name) => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return RESERVED_NAMES.some((word) => lowerName.includes(word));
};

module.exports = {
  containsReservedWord,
};
