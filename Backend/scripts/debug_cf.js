require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

console.log("--- Debugging Configuration ---");
console.log(
  "CLOUDFLARE_ACCOUNT_ID:",
  ACCOUNT_ID ? `${ACCOUNT_ID.substring(0, 5)}...` : "MISSING"
);
console.log(
  "CLOUDFLARE_API_TOKEN:",
  TOKEN ? `${TOKEN.substring(0, 5)}...` : "MISSING"
);

async function verifyToken() {
  console.log("--- Verifying Token Identity ---");
  try {
    const res = await axios.get(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log("✅ Token Status:", res.data.result.status);
    console.log("✅ Token ID:", res.data.result.id);
  } catch (error) {
    console.error(
      "❌ Token Verification Failed:",
      error.response?.data || error.message
    );
  }
}

async function listAccounts() {
  console.log("\n--- Listing Accounts ---");
  try {
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log("✅ Accounts Found:", res.data.result.length);
    res.data.result.forEach((acc) => {
      console.log(`   - ${acc.name} (${acc.id})`);
      if (acc.id === ACCOUNT_ID) console.log("     ^ MATCHES CONFIGURED ID!");
    });
  } catch (error) {
    console.error(
      "❌ List Accounts Failed:",
      error.response?.data || error.message
    );
  }
}

async function testConnection() {
  try {
    console.log("\n--- Testing GET Images (Auth Check) ---");
    const res = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log(
      "✅ Connection Successful! Found",
      res.data.result.images.length,
      "images."
    );
  } catch (error) {
    if (error.response?.status === 404) {
      console.error(
        "❌ Connection Failed: Account ID not found or Images not enabled for this account."
      );
    } else {
      console.error(
        "❌ Connection Failed:",
        error.response?.data || error.message
      );
    }
  }
}

async function testUpload() {
  console.log("\n--- Testing Mock Upload ---");
  try {
    // Create a tiny valid dummy PNG buffer (1x1 pixel)
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    const form = new FormData();
    form.append("file", dummyPng, {
      filename: "debug_test.png",
      contentType: "image/png",
    });

    const res = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );
    console.log("✅ Upload Successful!", res.data.result.id);
  } catch (error) {
    console.error("❌ Upload Failed:", error.response?.data || error.message);
  }
}

async function run() {
  await verifyToken();
  await listAccounts();
  await testConnection();
  await testUpload();
}

run();
