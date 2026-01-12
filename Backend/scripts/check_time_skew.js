const https = require("https");

console.log("--- Time Skew Check ---");
console.log("Local Time:", new Date().toISOString());

const req = https.request(
  "https://www.google.com",
  { method: "HEAD" },
  (res) => {
    const serverTimeStr = res.headers.date;
    if (serverTimeStr) {
      const serverTime = new Date(serverTimeStr);
      console.log("Server Time (Google):", serverTime.toISOString());

      const diff = serverTime.getTime() - Date.now();
      console.log("Difference (ms):", diff);
      console.log("Difference (hours):", diff / 1000 / 60 / 60);
      console.log("Difference (days):", diff / 1000 / 60 / 60 / 24);
    } else {
      console.log("Could not retrieve Date header.");
    }
  }
);

req.on("error", (e) => {
  console.error("Error fetching time:", e.message);
});

req.end();
