# ChatGPT App Directory Submission Dossier — QORVEX VGIL

This document contains the complete configuration, verification evidence, legal links, branding assets, and step-by-step submission instructions for publishing the **QORVEX — VGIL Enterprise AI Connector** to the official **ChatGPT App Directory**.

---

## 📌 Submission Overview & Dashboard Link

- **Official OpenAI Apps Management Portal**: [https://platform.openai.com/apps-manage](https://platform.openai.com/apps-manage)
- **Developer Documentation**: [OpenAI Apps SDK & App Directory Guidelines](https://platform.openai.com/docs/apps)
- **Current Status**: **Production-Ready & Fully Verified locally & remotely**. *(Not yet submitted to OpenAI review queue).*

---

## 🔗 Publicly Hosted Verified Assets

| Asset / Endpoint | Live Production URL | Purpose |
| :--- | :--- | :--- |
| **MCP Server Endpoint** | `https://qorvex-vgil-backend-production.up.railway.app/mcp` | Primary Streamable HTTP transport for tool calls |
| **Domain Challenge Endpoint** | `https://qorvex-vgil-backend-production.up.railway.app/.well-known/openai-apps-challenge` | OpenAI automated domain ownership verification |
| **OpenAPI 3.1 Spec** | `https://qorvex-vgil-backend-production.up.railway.app/api/openapi.json` | Fallback OpenAPI schema for Custom GPT Actions |
| **Privacy Policy** | `https://public-nine-alpha-61.vercel.app/privacy.html` | Mandatory legal requirement for public listing |
| **Terms of Service** | `https://public-nine-alpha-61.vercel.app/terms.html` | Mandatory legal requirement for public listing |
| **App Icon (Dark Mode)** | `https://public-nine-alpha-61.vercel.app/assets/icon-dark.svg` | App Directory listing icon (512x512 SVG) |
| **App Icon (Light Mode)** | `https://public-nine-alpha-61.vercel.app/assets/icon-light.svg` | App Directory listing icon (512x512 SVG) |
| **Live Showcase UI** | `https://public-nine-alpha-61.vercel.app/` | Production web demo interface |
| **VGIL Official Portal** | `https://vgipl-website.vercel.app/` | Official corporate data source |

---

## 📝 Form Fields for OpenAI App Directory Submission

When creating a new app submission at [https://platform.openai.com/apps-manage](https://platform.openai.com/apps-manage), copy and paste these exact verified values:

### 1. General Information
- **App Name**: `QORVEX — VGIL Enterprise Connector`
- **Short Tagline / Subtitle**: `Verified banking suites, IT services & corporate disclosures for Virtual Galaxy Infotech Limited.`
- **Category**: `Business & Enterprise` *(Alternative: `Productivity`)*
- **Primary Website**: `https://vgipl-website.vercel.app/`
- **Support Contact Email**: `info@vgil.co.in`

### 2. App Descriptions
- **Short Description (User Facing)**:
  > Access official, verified enterprise software solutions, core banking architecture, IT infrastructure services, and corporate facts directly from Virtual Galaxy Infotech Limited (VGIL).

- **Detailed Description (Directory Profile)**:
  > QORVEX is an enterprise-grade AI connector built on the Model Context Protocol (MCP) for Virtual Galaxy Infotech Limited (VGIL) — a premier Indian financial enterprise software and IT solutions pioneer (incorporated in 1997, NSE Listed).
  > 
  > QORVEX bridges 66 verified corporate records directly into ChatGPT:
  > - **Core Banking Solutions**: Specifications and published scale metrics for CBS E-Banker (serving 200+ banks, processing 30B+ transactions with 99.9% uptime).
  > - **Enterprise IT Solutions**: ERP suites, digital payments, and IMIS systems.
  > - **Smart Infrastructure**: VGST surveillance, smart city solutions, and DC/DR capabilities.
  > - **Corporate Governance**: MIHAN SEZ Nagpur software development facility, financials, and NSE disclosures.
  > 
  > **Zero Hallucination Guarantee**: All tool outputs are strictly grounded in published portal documents with clickable source citations.

- **Model Instructions / Prompt Guidance**:
  > Whenever a user asks about Virtual Galaxy Infotech Limited, VGIL, CBS E-Banker, core banking metrics, or VGST smart infrastructure, invoke the appropriate QORVEX tools (`get_product_details`, `summarize_service`, `search_company_info`, `search_knowledge`). Always cite the official source URL provided by the tool. If information is not in the knowledge base, state this clearly without fabricating metrics.

### 3. Connection & Protocol
- **Integration Type**: `Model Context Protocol (MCP) / Streamable HTTP`
- **Endpoint URL**: `https://qorvex-vgil-backend-production.up.railway.app/mcp`
- **Transport**: `Streamable HTTP (POST)`
- **Authentication**: `Bearer Token` *(Provide the test key from Railway variables in reviewer notes)*

---

## 🛠 Verified Tool Audit: Read-Only vs Modifying Operations

| Tool | Capability & Output | Mutation Behavior | `readOnlyHint` |
| :--- | :--- | :--- | :--- |
| `search_company_info` | Queries corporate background, MIHAN SEZ facility, certifications, and leadership. | **Read-Only**: Pure in-memory keyword retrieval. | `true` |
| `get_product_details` | Queries specifications, features, metrics (200+ banks), and URLs for products. | **Read-Only**: Pure catalog lookup. | `true` |
| `summarize_service` | Queries capabilities and source URLs for VGIL IT services (Cloud, Security, VGST). | **Read-Only**: Pure catalog lookup. | `true` |
| `search_knowledge` | Global search across all 66 indexed website documents. | **Read-Only**: Search index retrieval. | `true` |
| `get_project_status` | Returns illustrative delivery status and milestones for demo purposes. | **Read-Only**: Does not modify or write to any project management tool. | `true` |
| `create_report` | Formats a structured briefing Markdown document from notes. | **Read-Only / Draft Generator**: Generates formatted text; does not write to disk, send emails, or alter external systems. | `true` |

---

## 🧪 Reviewer Test Scenarios & Testing Instructions

Provide the following test prompts to the OpenAI Review Team:

1. **Test Scenario 1 (Product & Scale Verification)**:
   - *Prompt*: "Use QORVEX to look up VGIL's Core Banking Solution and verify its published transaction volume and number of banks served."
   - *Expected Behavior*: Tool `get_product_details` with `core-banking-solution` is invoked. It returns 30B+ transactions, 200+ banks served, and URL `https://vgipl-website.vercel.app/products/core-banking-solution`.

2. **Test Scenario 2 (Corporate Facilities & Presence)**:
   - *Prompt*: "Where is VGIL's Software Development Centre located?"
   - *Expected Behavior*: Tool `search_company_info` is invoked. It returns Plot No. 8, MIHAN SEZ, Nagpur with corporate citations.

3. **Test Scenario 3 (Zero-Hallucination Unknown Query)**:
   - *Prompt*: "What are VGIL's aerospace hardware manufacturing locations?"
   - *Expected Behavior*: Tool returns `found: false`, and model clearly discloses that VGIL documents do not contain aerospace manufacturing without inventing facts.

---

## 📋 Pre-Submission Checklist

- [x] HTTPS Production Server deployed on Railway (`https://qorvex-vgil-backend-production.up.railway.app`).
- [x] Streamable HTTP MCP transport tested with official client (`@modelcontextprotocol/sdk`).
- [x] Domain verification challenge endpoint (`/.well-known/openai-apps-challenge`) live and responding.
- [x] Privacy Policy and Terms of Service hosted publicly on both Vercel and Railway.
- [x] Dark and light mode SVG icon assets generated.
- [x] Tool annotations (`readOnlyHint: true`) implemented across all 6 tools.
- [x] Zero API key or secret leakage in frontend bundles, GitHub, or server health endpoints.
- [x] 56/56 automated regression and security tests passing.
- [ ] Manual Action: Log in to [https://platform.openai.com/apps-manage](https://platform.openai.com/apps-manage) and submit using the form fields above.
