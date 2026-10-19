import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, "dist-plugin");
const zipPath = path.join(rootDir, "qorvex-vgil-plugin.zip");

console.log("=== QORVEX VGIL Plugin Packaging & Validation Pipeline ===\n");

// 1. Clean Staging Directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(path.join(stagingDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(stagingDir, "skills", "vgil-assistant"), { recursive: true });
fs.mkdirSync(path.join(stagingDir, ".well-known"), { recursive: true });
fs.mkdirSync(path.join(stagingDir, ".codex-plugin"), { recursive: true });

// 2. Prepare plugin.json (Agent Plugins 1.0.0 Specification)
const pluginManifest = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  name: "qorvex-vgil-connector",
  version: "1.0.0",
  description: "Verified banking suites, IT services, smart infrastructure, and corporate disclosures for Virtual Galaxy Infotech Limited (VGIL).",
  author: {
    name: "Virtual Galaxy Infotech Limited",
    email: "info@vgil.co.in",
    url: "https://vgipl-website.vercel.app/"
  },
  homepage: "https://public-nine-alpha-61.vercel.app",
  repository: "https://github.com/DataBuks11/QORVEX_VGIL_SyncAI_MCP_MVP",
  license: "Apache-2.0",
  keywords: [
    "banking",
    "cbs-ebanker",
    "enterprise-it",
    "mcp",
    "vgil",
    "smart-city",
    "cloud"
  ],
  extensions: {
    "com.openai": {
      interface: {
        displayName: "QORVEX — VGIL Enterprise Connector",
        shortDescription: "Verified VGIL banking & IT solutions",
        longDescription: "Official AI connector for Virtual Galaxy Infotech Limited (VGIL). Access CBS E-Banker metrics, enterprise IT suites, smart city infrastructure, and corporate disclosures with source grounding.",
        developerName: "Virtual Galaxy Infotech Limited",
        category: "Business",
        capabilities: [
          "Query CBS E-Banker scale metrics, core banking modules, and uptime SLAs",
          "Retrieve VGIL enterprise IT and IMIS software specifications",
          "Search smart infrastructure, surveillance, and data center capabilities",
          "Access verified corporate governance, MIHAN SEZ facility data, and financial disclosures"
        ],
        websiteURL: "https://vgipl-website.vercel.app/",
        supportURL: "https://vgipl-website.vercel.app/contact",
        privacyPolicyURL: "https://public-nine-alpha-61.vercel.app/privacy.html",
        termsOfServiceURL: "https://public-nine-alpha-61.vercel.app/terms.html",
        logo: "./assets/icon.png",
        composerIcon: "./assets/composer-icon.png",
        defaultPrompt: [
          "What are the verified scale metrics and architecture of CBS E-Banker?",
          "Summarize VGIL's enterprise smart infrastructure and data center services.",
          "Tell me about VGIL's MIHAN SEZ Nagpur software development facility."
        ]
      },
      review: {
        test_cases: {
          positive: [
            {
              description: "Search product details for core banking",
              prompt: "What features and scale metrics are documented for CBS E-Banker?",
              expected_behavior: "Retrieves official CBS E-Banker record citing 200+ banks, 30B+ transactions, and 99.9% uptime."
            },
            {
              description: "Search company info",
              prompt: "Where is the VGIL software development facility located and what certifications does it have?",
              expected_behavior: "Retrieves MIHAN SEZ Nagpur facility facts and corporate details."
            }
          ],
          negative: [
            {
              description: "Unrelated request outside VGIL corporate domain",
              prompt: "Write a fictional story about space exploration."
            }
          ]
        },
        notes_for_reviewer: "All 6 tools are strictly read-only and query indexed VGIL corporate knowledge. The MCP server runs over Streamable HTTP at https://qorvex-vgil-backend-production.up.railway.app/mcp with Bearer token authentication or open endpoints."
      }
    }
  }
};

fs.writeFileSync(path.join(stagingDir, "plugin.json"), JSON.stringify(pluginManifest, null, 2), "utf8");
fs.writeFileSync(path.join(stagingDir, ".codex-plugin", "plugin.json"), JSON.stringify(pluginManifest, null, 2), "utf8");

// 3. Prepare mcp.json (Agent Plugins 1.0.0 Specification)
const mcpConfig = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  mcpServers: {
    "qorvex-vgil": {
      type: "streamable-http",
      url: "https://qorvex-vgil-backend-production.up.railway.app/mcp"
    }
  }
};

fs.writeFileSync(path.join(stagingDir, "mcp.json"), JSON.stringify(mcpConfig, null, 2), "utf8");

// 4. Prepare skills/vgil-assistant/SKILL.md
const skillMarkdown = `---
name: vgil-assistant
description: Access verified Virtual Galaxy Infotech Limited (VGIL) enterprise banking suites, IT services, smart infrastructure, and corporate disclosures.
---

# VGIL Enterprise Assistant Skill

This skill guides the AI assistant on when and how to invoke the 6 verified tools provided by the **QORVEX VGIL Enterprise AI Connector**.

## Corporate Background (VGIL)
- **Identity**: Virtual Galaxy Infotech Limited (VGIL), established in 1997, NSE-listed premier software engineering and financial IT pioneer.
- **Headquarters & Facilities**: Flagship Software Development Facility at MIHAN SEZ, Nagpur, Maharashtra, India.
- **Core Flagship Product**: **CBS E-Banker** (Core Banking Solution), serving 200+ commercial, cooperative, and rural banks, processing 30+ Billion transactions with 99.9% uptime.
- **Enterprise Offerings**: ERP Solutions, IMIS, Digital Payments (IMPS, UPI, BBPS, RTGS/NEFT), Smart City Surveillance (VGST), Tier-3 DC/DR Cloud Infrastructure, Cybersecurity, and Mobile Computing.

## Available Tools & Trigger Conditions

1. \`get_product_details\`:
   - **Trigger**: When the user asks about software products (CBS E-Banker, ERP Solution, Digital Payment Suite, IMIS).
   - **Expected Output**: Full technical features, scale metrics, architecture, and official verification URLs.

2. \`summarize_service\`:
   - **Trigger**: When the user inquires about IT services (VGST Smart Technology, DC/DR Cloud, Cybersecurity, Mobile Computing).
   - **Expected Output**: Domain summary, technical capabilities, service scope, and official URLs.

3. \`search_company_info\`:
   - **Trigger**: When the user asks about VGIL leadership, corporate background, MIHAN SEZ facility, certifications, or stock/investor background.
   - **Expected Output**: Verified corporate profile records with direct citations.

4. \`search_knowledge\`:
   - **Trigger**: Universal search for broad queries matching keywords across all 66 indexed website records.
   - **Expected Output**: Top ranking matching records with snippet highlights and URLs.

5. \`get_project_status\`:
   - **Trigger**: Inquiries regarding implementation timelines, milestone deliveries, or SLA uptime tracking.
   - **Expected Output**: Structured implementation status without modifying external systems.

6. \`create_report\`:
   - **Trigger**: Requests to synthesize retrieved VGIL technical and financial facts into executive briefing notes.
   - **Expected Output**: Markdown formatted corporate briefing.

## Grounding & Behavioral Rules
- **Strict Grounding**: Only state facts present in the retrieved tool data. Never invent transaction numbers, client counts, or dates.
- **Always Cite Sources**: Every answer must include the official website source URL provided by the tool response.
- **Read-Only Operation**: All tools are strictly non-destructive and read-only.
- **Boundary Handling**: If a user asks for information outside the VGIL domain, politely indicate that QORVEX is restricted to verified Virtual Galaxy Infotech Limited enterprise systems.
`;

fs.writeFileSync(path.join(stagingDir, "skills", "vgil-assistant", "SKILL.md"), skillMarkdown, "utf8");

// 5. Prepare Assets (copy PNGs and SVGs)
const sourceAssetsDir = path.join(rootDir, "public", "assets");
const destAssetsDir = path.join(stagingDir, "assets");

const assetFiles = ["icon-dark.png", "icon-light.png", "icon.png", "composer-icon.png", "icon-dark.svg", "icon-light.svg"];
for (const file of assetFiles) {
  const src = path.join(sourceAssetsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destAssetsDir, file));
    console.log(`✓ Copied asset: assets/${file} (${fs.statSync(src).size} bytes)`);
  } else {
    console.warn(`⚠ Missing asset: ${src}`);
  }
}

// 6. Prepare .well-known/ai-plugin.json (OpenAI Classic Plugin Manifest)
const aiPluginManifest = {
  schema_version: "v1",
  name_for_human: "QORVEX — VGIL Enterprise Connector",
  name_for_model: "qorvex_vgil_connector",
  description_for_human: "Verified enterprise software solutions, core banking architecture, IT infrastructure services, and corporate facts from Virtual Galaxy Infotech Limited (VGIL).",
  description_for_model: "Access official, verified information about Virtual Galaxy Infotech Limited (VGIL), including its flagship Core Banking Solution (CBS E-Banker), ERP solutions, VGST smart technology, digital payments, corporate profile, MIHAN SEZ Nagpur software development facility, and published scale metrics (30B+ transactions, 200+ banks served, 99.9% uptime). All facts returned are strictly grounded in verified documentation without hallucination.",
  auth: {
    type: "none"
  },
  api: {
    type: "openapi",
    url: "https://qorvex-vgil-backend-production.up.railway.app/api/openapi.json"
  },
  logo_url: "https://public-nine-alpha-61.vercel.app/assets/icon-dark.svg",
  contact_email: "info@vgil.co.in",
  legal_info_url: "https://public-nine-alpha-61.vercel.app/terms.html"
};
fs.writeFileSync(path.join(stagingDir, ".well-known", "ai-plugin.json"), JSON.stringify(aiPluginManifest, null, 2), "utf8");

// 7. Prepare openapi.json (OpenAPI 3.1 Spec for Custom GPT Actions & Classic Plugins)
const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "QORVEX — VGIL Enterprise AI Connector API",
    version: "1.0.0",
    description: "Enterprise AI connector exposing verified knowledge and search from Virtual Galaxy Infotech Limited (VGIL)."
  },
  servers: [
    {
      url: "https://qorvex-vgil-backend-production.up.railway.app"
    }
  ],
  paths: {
    "/api/search": {
      get: {
        operationId: "searchVGILKnowledge",
        summary: "Search verified VGIL knowledge base",
        description: "Search official company background, products, services, investor relations, and resources from VGIL.",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search keyword or phrase (e.g. 'core banking', 'VGST', 'MIHAN')",
            schema: { type: "string" }
          },
          {
            name: "category",
            in: "query",
            required: false,
            description: "Optional category filter: company, product, service, investor, resource, career",
            schema: {
              type: "string",
              enum: ["company", "product", "service", "investor", "resource", "career"]
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum number of results to return (default 5)",
            schema: { type: "integer", default: 5 }
          }
        ],
        responses: {
          "200": {
            description: "Successful search results",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          }
        }
      }
    },
    "/api/chat": {
      post: {
        operationId: "chatVGILAssistant",
        summary: "Ask a question about VGIL with grounded answers",
        description: "Submit a question about VGIL products, services, financials, or offices to receive a strictly grounded answer with citations.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    description: "User question about VGIL products, services, or company information"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Grounded AI answer with citations",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          }
        }
      }
    },
    "/health": {
      get: {
        operationId: "getHealthStatus",
        summary: "System health and index status",
        description: "Returns service operational health, number of indexed records, and runtime mode.",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          }
        }
      }
    }
  }
};
fs.writeFileSync(path.join(stagingDir, "openapi.json"), JSON.stringify(openapiSpec, null, 2), "utf8");

// 8. Prepare README.md in Staging Dir
const packageReadme = `# QORVEX VGIL Enterprise AI Connector Plugin Package

This archive contains the official distribution package for the **QORVEX VGIL Enterprise AI Connector**, ready for upload to OpenAI Plugin Creator and ChatGPT App Directory.

## Package Structure
- \`plugin.json\`: Agent Plugins 1.0.0 manifest with \`extensions.com.openai\` presentation and review metadata.
- \`mcp.json\`: Agent Plugins 1.0.0 Model Context Protocol configuration pointing to the production Streamable HTTP endpoint.
- \`skills/vgil-assistant/SKILL.md\`: Standardized workflow and grounding instructions.
- \`assets/\`: 512x512 and 128x128 icons (PNG + SVG).
- \`.well-known/ai-plugin.json\`: OpenAI classic plugin manifest.
- \`.codex-plugin/plugin.json\`: Codex-compatible plugin manifest alias.
- \`openapi.json\`: OpenAPI 3.1 specification.

## Production Endpoints
- **Railway MCP Endpoint**: \`https://qorvex-vgil-backend-production.up.railway.app/mcp\`
- **OpenAPI Schema**: \`https://qorvex-vgil-backend-production.up.railway.app/api/openapi.json\`
- **Privacy Policy**: \`https://public-nine-alpha-61.vercel.app/privacy.html\`
- **Terms of Service**: \`https://public-nine-alpha-61.vercel.app/terms.html\`
- **Source Repository**: \`https://github.com/DataBuks11/QORVEX_VGIL_SyncAI_MCP_MVP\`
`;
fs.writeFileSync(path.join(stagingDir, "README.md"), packageReadme, "utf8");

console.log("\nStaging files created successfully.");
