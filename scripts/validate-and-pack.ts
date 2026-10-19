import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, "dist-plugin");
const zipPath = path.join(rootDir, "qorvex-vgil-plugin.zip");

console.log("=== Running Automated Quality, Schema & Security Audit ===\n");

let failures = 0;
function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failures++;
  }
}

// 1. Validate plugin.json against Agent Plugins 1.0.0 Schema
console.log("1. Checking plugin.json Schema Compliance...");
const pluginJsonPath = path.join(stagingDir, "plugin.json");
assert(fs.existsSync(pluginJsonPath), "plugin.json exists at root");

const pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
assert(pluginData.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Valid $schema URL");
assert(typeof pluginData.name === "string" && /^[a-z0-9.-]+$/.test(pluginData.name), "Valid package name slug");
assert(typeof pluginData.version === "string", "Version specified");
assert(typeof pluginData.description === "string" && pluginData.description.length > 10, "Description provided");
assert(pluginData.author && pluginData.author.email, "Author contact details present");
assert(pluginData.extensions && pluginData.extensions["com.openai"], "OpenAI extension block present");

const openaiExt = pluginData.extensions["com.openai"];
assert(openaiExt.interface && openaiExt.interface.displayName, "Display name declared");
assert(openaiExt.interface.logo && fs.existsSync(path.join(stagingDir, openaiExt.interface.logo)), "Referenced logo file exists");
assert(openaiExt.interface.composerIcon && fs.existsSync(path.join(stagingDir, openaiExt.interface.composerIcon)), "Referenced composerIcon file exists");
assert(openaiExt.interface.privacyPolicyURL && openaiExt.interface.privacyPolicyURL.startsWith("https://"), "Valid HTTPS Privacy Policy URL");
assert(openaiExt.interface.termsOfServiceURL && openaiExt.interface.termsOfServiceURL.startsWith("https://"), "Valid HTTPS Terms of Service URL");
assert(openaiExt.review && openaiExt.review.test_cases && openaiExt.review.test_cases.positive.length >= 2, "At least 2 positive review test cases provided");
assert(openaiExt.review.test_cases.negative && openaiExt.review.test_cases.negative.length >= 1, "Negative review test case provided");

// 2. Validate mcp.json against Agent Plugins 1.0.0 Schema
console.log("\n2. Checking mcp.json Configuration...");
const mcpJsonPath = path.join(stagingDir, "mcp.json");
assert(fs.existsSync(mcpJsonPath), "mcp.json exists at root");
const mcpData = JSON.parse(fs.readFileSync(mcpJsonPath, "utf8"));
assert(mcpData.$schema === "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", "Valid $schema URL for MCP");
assert(mcpData.mcpServers && mcpData.mcpServers["qorvex-vgil"], "qorvex-vgil server defined");
const server = mcpData.mcpServers["qorvex-vgil"];
assert(server.type === "streamable-http", "Server type is streamable-http");
assert(server.url && server.url.startsWith("https://"), "Server URL is valid HTTPS");

// 3. Validate Skills
console.log("\n3. Checking Agent Skills...");
const skillPath = path.join(stagingDir, "skills", "vgil-assistant", "SKILL.md");
assert(fs.existsSync(skillPath), "skills/vgil-assistant/SKILL.md exists");
const skillContent = fs.readFileSync(skillPath, "utf8");
assert(skillContent.startsWith("---"), "SKILL.md starts with YAML frontmatter");
assert(/name:\s*vgil-assistant/.test(skillContent), "Skill name matches directory");
assert(/description:/.test(skillContent), "Skill description defined in frontmatter");
assert(skillContent.includes("get_product_details"), "All 6 tools referenced (get_product_details)");
assert(skillContent.includes("summarize_service"), "All 6 tools referenced (summarize_service)");
assert(skillContent.includes("search_company_info"), "All 6 tools referenced (search_company_info)");
assert(skillContent.includes("search_knowledge"), "All 6 tools referenced (search_knowledge)");
assert(skillContent.includes("get_project_status"), "All 6 tools referenced (get_project_status)");
assert(skillContent.includes("create_report"), "All 6 tools referenced (create_report)");

// 4. Validate Asset Images
console.log("\n4. Checking Branding Assets...");
const pngSignatures: Record<string, number[]> = {
  "assets/icon.png": [512, 512],
  "assets/icon-dark.png": [512, 512],
  "assets/icon-light.png": [512, 512],
  "assets/composer-icon.png": [128, 128]
};

for (const [relPath, [w, h]] of Object.entries(pngSignatures)) {
  const filePath = path.join(stagingDir, relPath);
  assert(fs.existsSync(filePath), `${relPath} exists`);
  const buf = fs.readFileSync(filePath);
  // PNG signature check
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  assert(isPng, `${relPath} has valid PNG signature`);
  // Read width/height from IHDR
  const imgW = buf.readUInt32BE(16);
  const imgH = buf.readUInt32BE(20);
  assert(imgW === w && imgH === h, `${relPath} dimensions match expected (${imgW}x${imgH} === ${w}x${h})`);
}

// 5. Security & Zero-Secret Audit
console.log("\n5. Running Security & Secret Scan on Package Files...");
const forbiddenNames = [".env", ".git", ".DS_Store", "node_modules", "Thumbs.db"];
const secretRegexes = [
  /ghp_[a-zA-Z0-9]{20,}/i,
  /vcp_[a-zA-Z0-9]{20,}/i,
  /railway[a-zA-Z0-9_-]{20,}/i,
  /sk-[a-zA-Z0-9]{20,}/i,
  /bearer\s+[a-zA-Z0-9._-]{20,}/i,
  /password\s*[:=]\s*["'][^"']+["']/i
];

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(stagingDir, fullPath);

    // Check filename
    for (const bad of forbiddenNames) {
      assert(!entry.name.includes(bad), `No sensitive file pattern (${rel})`);
    }

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".json", ".md", ".txt", ".svg"].includes(ext)) {
        const text = fs.readFileSync(fullPath, "utf8");
        for (const regex of secretRegexes) {
          const match = text.match(regex);
          assert(!match, `Zero secrets in ${rel}`);
        }
      }
    }
  }
}
scanDir(stagingDir);

// 6. Dual Compatibility Files
console.log("\n6. Checking Dual / Universal Compatibility Files...");
assert(fs.existsSync(path.join(stagingDir, ".well-known", "ai-plugin.json")), ".well-known/ai-plugin.json exists for classic plugins");
assert(fs.existsSync(path.join(stagingDir, ".codex-plugin", "plugin.json")), ".codex-plugin/plugin.json exists for Codex");
assert(fs.existsSync(path.join(stagingDir, "openapi.json")), "openapi.json exists for ChatGPT Actions");
assert(fs.existsSync(path.join(stagingDir, "README.md")), "README.md exists");

if (failures > 0) {
  console.error(`\nAudit failed with ${failures} error(s). Aborting zip creation.`);
  process.exit(1);
}

// 7. Generate Clean ZIP Archive using PowerShell Compress-Archive
console.log("\n7. Packaging Clean ZIP Archive...");
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

execSync("powershell -Command \"Compress-Archive -Path 'dist-plugin\\*' -DestinationPath 'qorvex-vgil-plugin.zip' -Force\"", { stdio: "inherit" });

console.log(`\n✓ Successfully generated ZIP archive at: ${zipPath}`);
const zipStats = fs.statSync(zipPath);
console.log(`  Archive Size: ${(zipStats.size / 1024).toFixed(2)} KB`);

// 8. Verify ZIP Contents
console.log("\n8. Verifying ZIP Archive Contents (Must be at root)...");
const tarOutput = execSync("tar -tf qorvex-vgil-plugin.zip", { encoding: "utf8" });
console.log("Archive File List:\n" + tarOutput);

assert(tarOutput.includes("plugin.json"), "ZIP root contains plugin.json");
assert(tarOutput.includes("mcp.json"), "ZIP root contains mcp.json");
assert(tarOutput.includes("skills/vgil-assistant/SKILL.md") || tarOutput.includes("skills\\vgil-assistant\\SKILL.md"), "ZIP contains skills/vgil-assistant/SKILL.md");
assert(tarOutput.includes("assets/icon.png") || tarOutput.includes("assets\\icon.png"), "ZIP contains assets/icon.png");
assert(tarOutput.includes(".well-known/ai-plugin.json") || tarOutput.includes(".well-known\\ai-plugin.json"), "ZIP contains .well-known/ai-plugin.json");
assert(tarOutput.includes("openapi.json"), "ZIP contains openapi.json");

console.log("\n========================================================");
console.log("✅ ALL VALIDATIONS PASSED. PACKAGE READY FOR UPLOAD.");
console.log("========================================================");

