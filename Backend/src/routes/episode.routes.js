const express = require("express");
const {
  listEpisodes,
  listLatestEpisodes,
  listScheduleEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
} = require("../controllers/episode.controller");

const router = express.Router();

router.get("/", listEpisodes);
router.get("/latest", listLatestEpisodes);
router.get("/schedule", listScheduleEpisodes);
router.get("/:id", getEpisodeById);
router.post("/", createEpisode);
router.put("/:id", updateEpisode);
router.delete("/:id", deleteEpisode);

module.exports = router;
