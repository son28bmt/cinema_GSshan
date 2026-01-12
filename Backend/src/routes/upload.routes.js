const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const multer = require("multer");

// Configure multer for temporary local storage
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), uploadController.uploadimage);

module.exports = router;
