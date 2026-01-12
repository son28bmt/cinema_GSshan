const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

console.log("--- R2 Debug Config ---");
console.log("System Time:", new Date().toISOString());
console.log("Account ID:", R2_ACCOUNT_ID);
console.log("Access Key ID:", R2_ACCESS_KEY_ID);
console.log(
  "Secret Key:",
  R2_SECRET_ACCESS_KEY
    ? `${R2_SECRET_ACCESS_KEY.substring(0, 5)}...`
    : "MISSING"
);

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function run() {
  try {
    console.log("\nAttempting to List Buckets...");
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log("✅ Connection Successful!");
    console.log(
      "Buckets:",
      response.Buckets.map((b) => b.Name)
    );
  } catch (error) {
    console.error("❌ Connection Failed:", error);
  }
}

run();
