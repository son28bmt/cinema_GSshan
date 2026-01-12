const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

const ACCOUNT_ID = "4c730d79188c5067abbfe662d4cc3bed";
const ACCESS_KEY = "f6cb2e08bade70d3e33215b0e922fd38";
const SECRET_KEY =
  "f5b00a16c92b8a7b44f2e7103af16864a259a508e3c568d594326b6cbb2a0e50";

async function test(region, endpointOverride) {
  const endpoint =
    endpointOverride || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  console.log(`\nTesting Region: ${region}, Endpoint: ${endpoint}`);

  const s3 = new S3Client({
    region: region,
    endpoint: endpoint,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  });

  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log(
      "✅ Success! Buckets:",
      data.Buckets.map((b) => b.Name)
    );
    return true;
  } catch (err) {
    console.log("❌ Failed:", err.Code || err.message);
    if (err.$metadata) console.log("   Status:", err.$metadata.httpStatusCode);
    return false;
  }
}

async function run() {
  // 1. Try us-east-1 (standard fallback)
  await test("us-east-1");

  // 2. Try 'auto' (standard R2)
  await test("auto");

  // 3. Try EU jurisdiction endpoint? (if applicable)
  // Cloudflare docs say jurisdiction header or endpoint?
  // Usually formatted as https://<account>.eu.r2.cloudflarestorage.com
  await test("auto", `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com`);

  // 4. Try us-east-1 with EU endpoint
  await test("us-east-1", `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com`);
}

run();
