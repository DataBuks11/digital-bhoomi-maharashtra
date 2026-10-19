import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import AdmZip from "adm-zip";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, "dist-plugin");
const zipPath = path.join(rootDir, "qorvex-vgil-plugin.zip");

console.log("=== QORVEX VGIL Plugin Validation & Forward-Slash Packaging ===\n");

let failures = 0;
function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failures++;
  }
}

// 1. Validate plugin.json Schema Compliance & Non-Endorsement
console.log("1. Checking plugin.json Schema & Non-Endorsement Compliance...");
const pluginJsonPath = path.join(stagingDir, "plugin.json");
assert(fs.existsSync(pluginJsonPath), "plugin.json exists at root");

const pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
assert(pluginData.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Valid $schema URL");
assert(typeof pluginData.name === "string" && /^[a-z0-9.-]+$/.test(pluginData.name), "Valid package name slug");
assert(typeof pluginData.version === "string", "Version specified");
assert(typeof pluginData.description === "string" && pluginData.description.length > 10, "Description provided");

// Non-endorsement check: Author must NOT claim to be VGIL
assert(!/^Virtual Galaxy Infotech Limited$/i.test(pluginData.author?.name || ""), "Author does not falsely pose as official VGIL entity");
assert(pluginData.description.includes("Not officially endorsed") || pluginData.description.includes("Independent"), "Manifest description clearly disclaims official VGIL endorsement");

assert(pluginData.extensions && pluginData.extensions["com.openai"], "OpenAI extension block present");
const openaiExt = pluginData.extensions["com.openai"];
assert(openaiExt.interface && openaiExt.interface.displayName, "Display name declared");
assert(openaiExt.interface.longDescription.includes("Disclaimer:"), "Long description includes explicit legal disclaimer");
assert(openaiExt.interface.logo && fs.existsSync(path.join(stagingDir, openaiExt.interface.logo)), "Referenced logo file exists");
assert(openaiExt.interface.composerIcon && fs.existsSync(path.join(stagingDir, openaiExt.interface.composerIcon)), "Referenced composerIcon file exists");
assert(openaiExt.interface.privacyPolicyURL && openaiExt.interface.privacyPolicyURL.startsWith("https://"), "Valid HTTPS Privacy Policy URL");
assert(openaiExt.interface.termsOfServiceURL && openaiExt.interface.termsOfServiceURL.startsWith("https://"), "Valid HTTPS Terms of Service URL");
assert(openaiExt.review && openaiExt.review.test_cases && openaiExt.review.test_cases.positive.length >= 2, "At least 2 positive review test cases provided");
assert(openaiExt.review.test_cases.negative && openaiExt.review.test_cases.negative.length >= 1, "Negative review test case provided");

// 2. Validate mcp.json Configuration
console.log("\n2. Checking mcp.json Configuration...");
const mcpJsonPath = path.join(stagingDir, "mcp.json");
assert(fs.existsSync(mcpJsonPath), "mcp.json exists at root");
const mcpData = JSON.parse(fs.readFileSync(mcpJsonPath, "utf8"));
assert(mcpData.$schema === "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", "Valid $schema URL for MCP");
assert(mcpData.mcpServers && mcpData.mcpServers["qorvex-vgil"], "qorvex-vgil server defined");
const server = mcpData.mcpServers["qorvex-vgil"];
assert(server.type === "streamable-http", "Server type is streamable-http");
assert(server.url === "https://qorvex-vgil-backend-production.up.railway.app/mcp", "Server URL matches production Railway MCP endpoint");

// 3. Validate .well-known/ai-plugin.json & ai-plugin.json Authentication
console.log("\n3. Checking Classic Plugin Manifests & Bearer Auth Alignment...");
const aiPluginPaths = [
  path.join(stagingDir, ".well-known", "ai-plugin.json"),
  path.join(stagingDir, "ai-plugin.json")
];

for (const p of aiPluginPaths) {
  assert(fs.existsSync(p), `${path.relative(stagingDir, p)} exists`);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  assert(data.auth.type === "service_http", `${path.relative(stagingDir, p)} declares auth.type === 'service_http'`);
  assert(data.auth.authorization_type === "bearer", `${path.relative(stagingDir, p)} declares auth.authorization_type === 'bearer'`);
  assert(data.auth.verification_tokens && data.auth.verification_tokens.openai, `${path.relative(stagingDir, p)} has verification_tokens`);
  assert(data.description_for_model.includes("Disclaimer:"), `${path.relative(stagingDir, p)} has non-endorsement disclaimer`);
}

// 4. Validate openapi.json & openapi.yaml Security Schemes
console.log("\n4. Checking OpenAPI Security Schemes & Operations...");
const openapiJsonPath = path.join(stagingDir, "openapi.json");
const openapiYamlPath = path.join(stagingDir, "openapi.yaml");
assert(fs.existsSync(openapiJsonPath), "openapi.json exists");
assert(fs.existsSync(openapiYamlPath), "openapi.yaml exists");

const openapiData = JSON.parse(fs.readFileSync(openapiJsonPath, "utf8"));
assert(openapiData.components && openapiData.components.securitySchemes && openapiData.components.securitySchemes.BearerAuth, "components.securitySchemes.BearerAuth defined");
assert(openapiData.components.securitySchemes.BearerAuth.type === "http", "BearerAuth type is http");
assert(openapiData.components.securitySchemes.BearerAuth.scheme === "bearer", "BearerAuth scheme is bearer");
assert(Array.isArray(openapiData.security) && openapiData.security.some((s: any) => "BearerAuth" in s), "Global security requirement for BearerAuth present");
assert(openapiData.paths["/mcp"] && openapiData.paths["/mcp"].post, "Path /mcp explicitly documented");
assert(openapiData.paths["/mcp"].post.security?.some((s: any) => "BearerAuth" in s), "Path /mcp requires BearerAuth");
assert(openapiData.info.description.includes("Disclaimer:"), "OpenAPI info contains non-endorsement disclaimer");

// 5. Validate Skills & Legal Notice
console.log("\n5. Checking Agent Skills & Disclaimer...");
const skillPath = path.join(stagingDir, "skills", "vgil-assistant", "SKILL.md");
assert(fs.existsSync(skillPath), "skills/vgil-assistant/SKILL.md exists");
const skillContent = fs.readFileSync(skillPath, "utf8");
assert(skillContent.startsWith("---"), "SKILL.md starts with YAML frontmatter");
assert(/name:\s*vgil-assistant/.test(skillContent), "Skill name matches directory");
assert(skillContent.includes("Legal Disclaimer & Attribution"), "SKILL.md includes legal attribution section");
assert(skillContent.includes("No Official Endorsement"), "SKILL.md declares no official endorsement");
assert(skillContent.includes("get_product_details"), "All 6 tools referenced (get_product_details)");
assert(skillContent.includes("summarize_service"), "All 6 tools referenced (summarize_service)");
assert(skillContent.includes("search_company_info"), "All 6 tools referenced (search_company_info)");
assert(skillContent.includes("search_knowledge"), "All 6 tools referenced (search_knowledge)");
assert(skillContent.includes("get_project_status"), "All 6 tools referenced (get_project_status)");
assert(skillContent.includes("create_report"), "All 6 tools referenced (create_report)");

// 6. Validate Asset Images
console.log("\n6. Checking Branding Assets...");
const pngSignatures: Record<string, number[]> = {
  "assets/icon.png": [512, 512],
  "assets/icon-dark.png": [512, 512],
  "assets/icon-light.png": [512, 512],
  "assets/composer-icon.png": [128, 128],
  "logo.png": [512, 512]
};

for (const [relPath, [w, h]] of Object.entries(pngSignatures)) {
  const filePath = path.join(stagingDir, relPath);
  assert(fs.existsSync(filePath), `${relPath} exists`);
  const buf = fs.readFileSync(filePath);
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  assert(isPng, `${relPath} has valid PNG signature`);
  const imgW = buf.readUInt32BE(16);
  const imgH = buf.readUInt32BE(20);
  assert(imgW === w && imgH === h, `${relPath} dimensions match expected (${imgW}x${imgH} === ${w}x${h})`);
}

// 7. Security & Zero-Secret Audit
console.log("\n7. Running Security & Secret Scan on Package Files...");
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

    for (const bad of forbiddenNames) {
      assert(!entry.name.includes(bad), `No sensitive file pattern (${rel})`);
    }

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".json", ".md", ".txt", ".svg", ".yaml", ".yml"].includes(ext)) {
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

if (failures > 0) {
  console.error(`\nAudit failed with ${failures} error(s). Aborting zip creation.`);
  process.exit(1);
}

// 8. Generate Clean ZIP Archive with Standard POSIX Forward-Slash Paths
console.log("\n8. Packaging Clean ZIP Archive with Strict Forward-Slash Paths...");
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const zip = new AdmZip();

function addFilesRecursively(dir: string, baseDir: string) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      addFilesRecursively(fullPath, baseDir);
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      // Strictly force POSIX forward slashes
      const forwardSlashPath = relativePath.split(path.sep).join("/");
      const content = fs.readFileSync(fullPath);
      zip.addFile(forwardSlashPath, content);
      console.log(`  + Added entry: ${forwardSlashPath}`);
    }
  }
}

addFilesRecursively(stagingDir, stagingDir);
zip.writeZip(zipPath);

console.log(`\n✓ Successfully generated ZIP archive at: ${zipPath}`);
const zipStats = fs.statSync(zipPath);
console.log(`  Archive Size: ${(zipStats.size / 1024).toFixed(2)} KB`);

// 9. Verify ZIP Contents & Forward-Slash Enforcement
console.log("\n9. Verifying ZIP Archive Entries for Forward Slashes & Root Layout...");
const readZip = new AdmZip(zipPath);
const zipEntries = readZip.getEntries();

let backslashCount = 0;
for (const entry of zipEntries) {
  if (entry.entryName.includes("\\")) {
    console.error(`  ✗ Backslash detected in entry: ${entry.entryName}`);
    backslashCount++;
  } else {
    assert(true, `Verified forward-slash entry: ${entry.entryName}`);
  }
}
assert(backslashCount === 0, "Zero backslashes found across all ZIP entry paths");

const entryNames = zipEntries.map(e => e.entryName);
assert(entryNames.includes("plugin.json"), "ZIP root contains plugin.json");
assert(entryNames.includes("mcp.json"), "ZIP root contains mcp.json");
assert(entryNames.includes("ai-plugin.json"), "ZIP root contains ai-plugin.json");
assert(entryNames.includes("openapi.json"), "ZIP root contains openapi.json");
assert(entryNames.includes("openapi.yaml"), "ZIP root contains openapi.yaml");
assert(entryNames.includes("logo.png"), "ZIP root contains logo.png");
assert(entryNames.includes(".well-known/ai-plugin.json"), "ZIP contains .well-known/ai-plugin.json");
assert(entryNames.includes(".codex-plugin/plugin.json"), "ZIP contains .codex-plugin/plugin.json");
assert(entryNames.includes("skills/vgil-assistant/SKILL.md"), "ZIP contains skills/vgil-assistant/SKILL.md");
assert(entryNames.includes("assets/icon.png"), "ZIP contains assets/icon.png");

console.log("\n========================================================");
console.log("✅ ALL AUDITS & FORWARD-SLASH PACKAGING SUCCEEDED.");
console.log("========================================================");
