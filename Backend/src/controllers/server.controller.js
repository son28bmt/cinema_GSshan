const serverService = require("../services/server.service");

const listServers = async (req, res, next) => {
  try {
    const servers = await serverService.listServers();
    return res.status(200).json({ servers });
  } catch (err) {
    return next(err);
  }
};

const createServer = async (req, res, next) => {
  try {
    const { name, endpointUrl, loadPercent, status } = req.body;

    if (!name || !endpointUrl) {
      return res.status(400).json({ message: "name and endpointUrl are required" });
    }

    const created = await serverService.createServer({
      name,
      endpointUrl,
      loadPercent: Number.isFinite(loadPercent) ? loadPercent : 0,
      status
    });

    return res.status(201).json({ server: created });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listServers,
  createServer
};
