const express = require("express");
const { listComments, createComment, reportComment, deleteComment } = require("../controllers/comment.controller");
const requireAuth = require("../middlewares/auth");

const router = express.Router();

router.get("/", listComments);
router.post("/", requireAuth, createComment);
router.post("/:id/report", requireAuth, reportComment);
router.delete("/:id", requireAuth, deleteComment);

module.exports = router;
