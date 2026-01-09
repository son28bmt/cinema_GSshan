const app = require("./app");
const { env, port } = require("./config/env");

app.listen(port, () => {
  console.log(`[server] ${env} listening on port ${port}`);
});
