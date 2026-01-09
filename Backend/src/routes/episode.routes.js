const express = require("express");
const { listEpisodes, listLatestEpisodes, listScheduleEpisodes, getEpisodeById, createEpisode } = require("../controllers/episode.controller");

const router = express.Router();

router.get("/", listEpisodes);
router.get("/latest", listLatestEpisodes);
router.get("/schedule", listScheduleEpisodes);
router.get("/:id", getEpisodeById);
router.post("/", createEpisode);

module.exports = router;
