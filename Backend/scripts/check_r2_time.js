const https = require("https");

const ACCOUNT_ID = "4c730d79188c5067abbfe662d4cc3bed";
const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

console.log("--- R2 Server Time Check ---");
console.log("Target:", endpoint);

const req = https.request(endpoint, { method: "HEAD" }, (res) => {
  console.log("Status:", res.statusCode);
  const serverTimeStr = res.headers.date;

  if (serverTimeStr) {
    const serverTime = new Date(serverTimeStr);
    console.log("R2 Server Time:", serverTime.toISOString());
    console.log("Local Time:", new Date().toISOString());

    const diff = Date.now() - serverTime.getTime();
    console.log("Clock Skew (Local - Remote):", diff, "ms");
  } else {
    console.log("No Date header received.");
  }
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.end();
