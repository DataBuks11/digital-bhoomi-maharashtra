import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, "dist-plugin");

console.log("=== QORVEX VGIL Plugin Staging & Asset Assembly Pipeline ===\n");

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
  description: "Independent AI connector providing grounded access to public banking suites, IT services, and corporate facts from Virtual Galaxy Infotech Limited (VGIL). Not officially endorsed by VGIL.",
  author: {
    name: "QORVEX Open Source Community",
    email: "support@databuks.com",
    url: "https://github.com/DataBuks11/QORVEX_VGIL_SyncAI_MCP_MVP"
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
    "knowledge-retrieval"
  ],
  extensions: {
    "com.openai": {
      interface: {
        displayName: "QORVEX — VGIL Knowledge Connector",
        shortDescription: "Grounded VGIL banking & IT data",
        longDescription: "Independent AI connector providing strictly grounded access to publicly available information from Virtual Galaxy Infotech Limited (VGIL). Query CBS E-Banker metrics, enterprise IT suites, smart infrastructure, and corporate disclosures with direct source citations. Disclaimer: This connector is independently developed and is not officially affiliated with or endorsed by Virtual Galaxy Infotech Limited.",
        developerName: "QORVEX Team",
        category: "Business",
        capabilities: [
          "Query CBS E-Banker scale metrics, core banking modules, and uptime SLAs from public disclosures",
          "Retrieve VGIL enterprise IT and IMIS software specifications",
          "Search smart infrastructure, surveillance, and data center capabilities",
          "Access verified corporate background, MIHAN SEZ facility data, and financial disclosures with source citations"
        ],
        websiteURL: "https://public-nine-alpha-61.vercel.app/",
        supportURL: "https://github.com/DataBuks11/QORVEX_VGIL_SyncAI_MCP_MVP/issues",
        privacyPolicyURL: "https://public-nine-alpha-61.vercel.app/privacy.html",
        termsOfServiceURL: "https://public-nine-alpha-61.vercel.app/terms.html",
        logo: "./assets/icon.png",
        composerIcon: "./assets/composer-icon.png",
        defaultPrompt: [
          "What are the published scale metrics and architecture of CBS E-Banker?",
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
              expected_behavior: "Retrieves published CBS E-Banker record citing 200+ banks, 30B+ transactions, and 99.9% uptime with source citation."
            },
            {
              description: "Search company info",
              prompt: "Where is the VGIL software development facility located and what certifications does it have?",
              expected_behavior: "Retrieves MIHAN SEZ Nagpur facility facts and corporate background from indexed public data."
            }
          ],
          negative: [
            {
              description: "Unrelated request outside VGIL corporate domain",
              prompt: "Write a fictional story about space exploration."
            }
          ]
        },
        notes_for_reviewer: "All 6 tools are strictly read-only and query indexed public VGIL corporate knowledge. The MCP server runs over Streamable HTTP at https://qorvex-vgil-backend-production.up.railway.app/mcp with Bearer token authentication configured in the platform."
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

# VGIL Knowledge Connector Skill

This skill guides the AI assistant on when and how to invoke the 6 verified tools provided by the **QORVEX VGIL Enterprise AI Connector**.

## Legal Disclaimer & Attribution
- **Independent Project**: QORVEX is an independent community AI connector built to retrieve and synthesize publicly available data from Virtual Galaxy Infotech Limited (VGIL) web documentation.
- **No Official Endorsement**: This tool is NOT officially affiliated with, sponsored by, or endorsed by Virtual Galaxy Infotech Limited.
- **Data Source**: Public corporate disclosures and web pages indexed from https://vgipl-website.vercel.app/.

## Corporate Subject Matter (Public VGIL Data)
- **Identity**: Virtual Galaxy Infotech Limited (VGIL), established in 1997, NSE-listed software engineering and financial IT solutions provider.
- **Headquarters & Facilities**: Flagship Software Development Facility at MIHAN SEZ, Nagpur, Maharashtra, India.
- **Core Flagship Product**: **CBS E-Banker** (Core Banking Solution), documented as serving 200+ commercial, cooperative, and rural banks, processing 30+ Billion transactions with 99.9% uptime.
- **Enterprise Offerings**: ERP Solutions, IMIS, Digital Payments (IMPS, UPI, BBPS, RTGS/NEFT), Smart City Surveillance (VGST), Tier-3 DC/DR Cloud Infrastructure, Cybersecurity, and Mobile Computing.

## Available Tools & Trigger Conditions

1. \`get_product_details\`:
   - **Trigger**: When the user asks about software products (CBS E-Banker, ERP Solution, Digital Payment Suite, IMIS).
   - **Expected Output**: Technical features, scale metrics, architecture, and official public verification URLs.

2. \`summarize_service\`:
   - **Trigger**: When the user inquires about IT services (VGST Smart Technology, DC/DR Cloud, Cybersecurity, Mobile Computing).
   - **Expected Output**: Domain summary, technical capabilities, service scope, and official URLs.

3. \`search_company_info\`:
   - **Trigger**: When the user asks about VGIL leadership, corporate background, MIHAN SEZ facility, certifications, or stock/investor background.
   - **Expected Output**: Published corporate profile records with direct citations.

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
- **Boundary Handling**: If a user asks for information outside the VGIL public domain, politely indicate that QORVEX is restricted to verified public Virtual Galaxy Infotech Limited documentation.
`;

fs.writeFileSync(path.join(stagingDir, "skills", "vgil-assistant", "SKILL.md"), skillMarkdown, "utf8");

// 5. Prepare Assets (copy PNGs and SVGs + root logo.png alias)
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

// Root alias logo.png for classic plugin uploaders
const rootLogoSrc = path.join(destAssetsDir, "icon.png");
if (fs.existsSync(rootLogoSrc)) {
  fs.copyFileSync(rootLogoSrc, path.join(stagingDir, "logo.png"));
  console.log(`✓ Copied root alias: logo.png`);
}

// 6. Prepare .well-known/ai-plugin.json AND root ai-plugin.json (OpenAI Classic Plugin Manifest)
// Crucial: Set auth to service_http with bearer authorization to match the Railway MCP server!
const aiPluginManifest = {
  schema_version: "v1",
  name_for_human: "QORVEX — VGIL Knowledge Connector",
  name_for_model: "qorvex_vgil_connector",
  description_for_human: "Independent AI connector providing grounded information about VGIL banking suites, IT services, and corporate disclosures from public documents.",
  description_for_model: "Access verified corporate, core banking (CBS E-Banker), IT solutions, and smart infrastructure metrics from public Virtual Galaxy Infotech Limited (VGIL) disclosures. Always cite official sources. Disclaimer: This connector is independently developed and is not officially affiliated with or endorsed by Virtual Galaxy Infotech Limited.",
  auth: {
    type: "service_http",
    authorization_type: "bearer",
    verification_tokens: {
      openai: "qorvex-openai-apps-challenge-verified"
    }
  },
  api: {
    type: "openapi",
    url: "https://qorvex-vgil-backend-production.up.railway.app/api/openapi.json",
    is_user_authenticated: false
  },
  logo_url: "https://public-nine-alpha-61.vercel.app/assets/icon-dark.svg",
  contact_email: "support@databuks.com",
  legal_info_url: "https://public-nine-alpha-61.vercel.app/terms.html"
};

const aiPluginStr = JSON.stringify(aiPluginManifest, null, 2);
fs.writeFileSync(path.join(stagingDir, ".well-known", "ai-plugin.json"), aiPluginStr, "utf8");
fs.writeFileSync(path.join(stagingDir, "ai-plugin.json"), aiPluginStr, "utf8");

// 7. Prepare openapi.json AND openapi.yaml (OpenAPI 3.1 Spec with BearerAuth Security Scheme)
const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "QORVEX — VGIL Knowledge Connector API",
    version: "1.0.0",
    description: "Independent AI connector providing grounded search and Model Context Protocol (MCP) access to public Virtual Galaxy Infotech Limited (VGIL) web documentation. Disclaimer: This service is independently developed and is not officially affiliated with or endorsed by Virtual Galaxy Infotech Limited."
  },
  servers: [
    {
      url: "https://qorvex-vgil-backend-production.up.railway.app"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "Enter the Bearer token configured for QORVEX VGIL Railway backend access."
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/mcp": {
      post: {
        operationId: "handleMCPStreamableHttp",
        summary: "Model Context Protocol (MCP) Streamable HTTP transport",
        description: "Executes MCP JSON-RPC protocol requests (tools/list, tools/call) against the QORVEX VGIL knowledge engine.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["jsonrpc", "method"],
                properties: {
                  jsonrpc: { type: "string", example: "2.0" },
                  id: { oneOf: [{ type: "string" }, { type: "integer" }], example: 1 },
                  method: { type: "string", example: "tools/call" },
                  params: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "MCP JSON-RPC response",
            content: { "application/json": { schema: { type: "object" } } }
          },
          "401": {
            description: "Unauthorized: Missing or malformed Bearer token",
            content: { "application/json": { schema: { type: "object" } } }
          }
        }
      }
    },
    "/api/search": {
      get: {
        operationId: "searchVGILKnowledge",
        summary: "Search verified VGIL knowledge base",
        description: "Search official company background, products, services, investor relations, and resources from public VGIL documentation.",
        security: [{ BearerAuth: [] }],
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
        security: [{ BearerAuth: [] }],
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
        security: [],
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
fs.writeFileSync(path.join(stagingDir, "openapi.yaml"), yaml.stringify(openapiSpec), "utf8");

// 8. Prepare README.md in Staging Dir
const packageReadme = `# QORVEX VGIL Knowledge Connector Plugin Package

This archive contains the official distribution package for the **QORVEX VGIL Knowledge Connector**, ready for upload to the OpenAI Plugin Creator, Codex extensions, and ChatGPT App Directory.

## Legal Disclaimer & Non-Endorsement Notice
**QORVEX is an independent, community-developed AI connector.** It provides grounded access to publicly available information from the published web documentation of Virtual Galaxy Infotech Limited (VGIL). QORVEX is **not** officially affiliated with, sponsored by, or endorsed by Virtual Galaxy Infotech Limited.

## Package Structure
- \`plugin.json\`: Agent Plugins 1.0.0 manifest with \`extensions.com.openai\` presentation and review metadata.
- \`mcp.json\`: Agent Plugins 1.0.0 Model Context Protocol configuration pointing to the production Streamable HTTP endpoint.
- \`skills/vgil-assistant/SKILL.md\`: Standardized workflow and grounding instructions.
- \`assets/\`: 512x512 and 128x128 icons (PNG + SVG).
- \`logo.png\`: Root icon alias for legacy uploaders.
- \`.well-known/ai-plugin.json\` & \`ai-plugin.json\`: OpenAI classic plugin manifest configured with Bearer HTTP authentication.
- \`.codex-plugin/plugin.json\`: Codex-compatible plugin manifest alias.
- \`openapi.json\` & \`openapi.yaml\`: OpenAPI 3.1 specification declaring BearerAuth security scheme and \`/mcp\` endpoint.

## Authentication
The Railway MCP endpoint enforces **Bearer token authentication**. In the OpenAI Plugin Creator / platform, configure:
- **Authentication Type**: Bearer / Service HTTP
- **Token**: Your configured \`MCP_API_KEY\`

## Production Endpoints
- **Railway MCP Endpoint**: \`https://qorvex-vgil-backend-production.up.railway.app/mcp\`
- **OpenAPI Schema**: \`https://qorvex-vgil-backend-production.up.railway.app/api/openapi.json\`
- **Privacy Policy**: \`https://public-nine-alpha-61.vercel.app/privacy.html\`
- **Terms of Service**: \`https://public-nine-alpha-61.vercel.app/terms.html\`
- **Source Repository**: \`https://github.com/DataBuks11/QORVEX_VGIL_SyncAI_MCP_MVP\`
`;

fs.writeFileSync(path.join(stagingDir, "README.md"), packageReadme, "utf8");

console.log("\nStaging files created successfully.");
