const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

const newVars = {
  CLOUDFLARE_ACCOUNT_ID: "4c730d79188c5067abbfe662d4cc3bed",
  R2_PUBLIC_DOMAIN: "https://pub-58c1a2fe07b6492fbadd2e958ca80bb9.r2.dev",
  // Placeholder keys until user provides them
  R2_ACCESS_KEY_ID: "f6cb2e08bade70d3e33215b0e922fd38",
  R2_SECRET_ACCESS_KEY:
    "f5b00a16c92b8a7b44f2e7103af16864a259a508e3c568d594326b6cbb2a0e50",
};

let updated = false;

for (const [key, value] of Object.entries(newVars)) {
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
    updated = true;
  } else {
    content += `\n${key}=${value}`;
    updated = true;
  }
}

if (updated) {
  fs.writeFileSync(envPath, content.trim() + "\n");
  console.log("Updated .env with Account ID and Public URL");
} else {
  console.log(".env already up to date");
}
