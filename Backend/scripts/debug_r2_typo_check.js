const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

// Corrected Access Key ID from 'f6cb' to 'fccb' based on visual re-inspection
const ACCESS_KEY = "fccb2e08bade70d3e33215b0e922fd38";
const SECRET_KEY =
  "f5b00a16c92b8a7b44f2e7103af16864a259a508e3c568d594326b6cbb2a0e50";
const ACCOUNT_ID = "4c730d79188c5067abbfe662d4cc3bed";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

async function run() {
  console.log("--- Debugging Typo Fix ---");
  console.log("Access Key:", ACCESS_KEY);
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log(
      "✅ Success! Buckets:",
      data.Buckets.map((b) => b.Name)
    );
  } catch (err) {
    console.error("❌ Failed:", err);
  }
}

run();
