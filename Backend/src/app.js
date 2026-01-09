require("./config/env");

const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const { corsOrigin } = require("./config/env");

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
