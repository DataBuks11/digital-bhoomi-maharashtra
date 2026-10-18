import fs from "fs";
import path from "path";

// Read public API base URL from environment variables
const apiBaseUrl = (
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  ""
).trim().replace(/\/+$/, "");

const configContent = `/**
 * Generated at build time by scripts/build-frontend.js
 * Source env: VITE_API_BASE_URL / API_BASE_URL
 */
window.QORVEX_CONFIG = {
  API_BASE_URL: ${JSON.stringify(apiBaseUrl)}
};
`;

const configPath = path.resolve(process.cwd(), "public", "config.js");
fs.writeFileSync(configPath, configContent, "utf-8");
console.log(`[build-frontend] Wrote public/config.js with API_BASE_URL: "${apiBaseUrl || '(same-origin relative)'}"`);
