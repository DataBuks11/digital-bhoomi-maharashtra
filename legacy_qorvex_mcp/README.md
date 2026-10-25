# QORVEX — Enterprise AI Connector for Virtual Galaxy Infotech Limited (VGIL)

> **QORVEX** is a modular enterprise AI connector and Model Context Protocol (MCP) prototype designed for **Virtual Galaxy Infotech Limited (VGIL)**. Inspired by enterprise AI integration patterns (such as Persistent Systems partner offerings), QORVEX bridges enterprise knowledge from the official [VGIL Web Portal](https://vgipl-website.vercel.app/) into leading AI workflows with zero hallucination and strict grounding.

---

## 🌟 Key Highlights & Architecture

- **66 Real Indexed Knowledge Records**: Extracted directly from VGIL's production website bundle (`data/vgil-knowledge.json`), covering 17 products, 7 services, 14 investor disclosures, 22 resource articles, 4 career openings, and 2 corporate profile documents.
- **Strict Grounding & Zero Hallucination**: Model answers are strictly grounded in retrieved factual documents. Questions outside the indexed VGIL domain cleanly return explicit notifications rather than fabricated claims.
- **Enterprise MCP Server (Streamable HTTP Transport)**: Implements standard Model Context Protocol via `@modelcontextprotocol/sdk` over Streamable HTTP (`/mcp`), secured with bearer token authentication (`MCP_API_KEY`).
- **TokenHarbor + DeepSeek V4.1 Flash**: Fast, cost-efficient LLM completions through the OpenAI-compatible TokenHarbor router (`https://tokenharbor.ai/v1`).
- **Modern Enterprise Web UI**: Responsive single-page interface with 5 dedicated operational views:
  1. **AI Assistant**: Natural language Q&A with live citations and suggested prompts.
  2. **Knowledge Search**: Direct sub-millisecond keyword lookup with category filters.
  3. **Products & Services**: Filterable catalog of verified banking, enterprise, and smart technology solutions.
  4. **MCP Integration**: Verified MCP endpoints, tools list, and client configuration snippets.
  5. **System Status**: Live telemetry, health metrics, and model status from `/health`.

```
                    +------------------------------------------+
                    |    Client Layer                          |
                    |  - QORVEX Enterprise Demo UI (Port 3000) |
                    |  - Claude Desktop / Cursor / Antigravity |
                    +--------------------+---------------------+
                                         |
                       HTTP / JSON-RPC   | Bearer Auth (MCP_API_KEY)
                                         v
+-------------------------------------------------------------------------------+
| QORVEX Express Engine                                                         |
|                                                                               |
|   +-----------------------+     +--------------------+   +----------------+   |
|   | /api/chat             |     | Streamable HTTP    |   | REST Endpoints |   |
|   | Grounded Orchestration|     | /mcp (MCP Server)  |   | /api/search    |   |
|   +-----------+-----------+     +---------+----------+   | /health        |   |
|               |                           |              +--------+-------+   |
|               v                           v                       |           |
|      +------------------------------------------+                 |           |
|      | VGIL Knowledge Store (66 Verified Docs)  |<----------------+           |
|      | - Token matching with word boundaries    |                             |
|      | - Category and subject-stopword filters  |                             |
|      +--------------------+---------------------+                             |
|                           |                                                   |
|                           v Retrieved Context                                 |
|      +------------------------------------------+                             |
|      | TokenHarbor Client (OpenAI-compatible)   |                             |
|      | Model: deepseek-v4.1-flash:free          |                             |
|      +--------------------+---------------------+                             |
+---------------------------|---------------------------------------------------+
                            v
+-------------------------------------------------------------------------------+
| External LLM Service                                                          |
| TokenHarbor Router (https://tokenharbor.ai/v1) -> DeepSeek V4.1 Flash         |
+-------------------------------------------------------------------------------+
```

---

## 🛠 Registered MCP Tools

All 6 tools are registered on the Streamable HTTP transport at `/mcp` and verified with automated test suites:

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| `search_company_info` | `query` (string) | Search corporate background, history, MIHAN SEZ facility, certifications, leadership, and contact data. |
| `get_product_details` | `product_name_or_slug` (string) | Retrieve verified specifications, features, metrics (e.g. 200+ banks, 30B+ transactions), and official product URLs. |
| `summarize_service` | `service_name_or_slug` (string) | Retrieve capabilities, offerings, and direct portal links for VGIL service domains (Cloud, Cybersecurity, AI/ML, etc.). |
| `search_knowledge` | `query`, `category` (optional), `limit` | Universal knowledge search across all 66 indexed VGIL records. |
| `get_project_status` | `project_id` (string) | Retrieve status and milestones for internal integration deliverables. |
| `create_report` | `title` (string), `notes` (string[]) | Assemble structured briefing drafts from verified notes. |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 20+ installed
- NPM 10+

### 2. Installation
```bash
git clone <repository_url>
cd QORVEX_VGIL_SyncAI_MCP_MVP
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```ini
PORT=3000
MCP_API_KEY=your_secure_mcp_api_key_here
LLM_BASE_URL=https://tokenharbor.ai/v1
LLM_API_KEY=your_tokenharbor_api_key_here
LLM_MODEL=deepseek-v4.1-flash:free
```

> **Security Note**: Never commit `.env` or paste live API keys into public logs. API keys are kept strictly server-side and masked in all client endpoints.

### 4. Build & Start Locally
```bash
# Build TypeScript
npm run build

# Start the server
npm start
```
Or run in development mode with live watch:
```bash
npm run dev
```

Open your browser to:
- **Enterprise Web UI**: `http://localhost:3000/`
- **Health Telemetry**: `http://localhost:3000/health`
- **MCP Endpoint**: `http://localhost:3000/mcp` (POST with Bearer header)

---

## 🧪 Automated Testing

Run the full unified test suite covering Phase 2 (Knowledge Ingestion & Indexing), Phase 3 (MCP Security & Transport), and Phase 4 (TokenHarbor LLM Grounded Chat):

```bash
npm test
```

### Test Suite Summary: 56/56 Passed (100%)
- **Phase 2 Suite (`scripts/test-phase2.ts`)**: 26 passed
  - KnowledgeStore integrity (66 records, 17 products, 7 services)
  - Keyword and word-boundary search relevance
  - Real source URL validation
  - MCP Tool schema registration and unknown item safety
- **Phase 3 & 4 Suite (`scripts/test-phase3-4.ts`)**: 30 passed
  - Bearer token authentication (401 on missing/invalid keys)
  - Streamable HTTP Transport with official MCP client
  - Remote tool execution (`tools/list` and `tools/call`)
  - Request length limiting & input sanitization
  - Strict unknown question fallback (zero hallucination)
  - Live TokenHarbor DeepSeek completion with real source attribution
  - Zero credential leakage in HTTP responses

---

## 🔌 Connecting External MCP Clients

### Claude Desktop Configuration
Add the following entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "qorvex-vgil": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer your_secure_mcp_api_key_here"
      }
    }
  }
}
```

### Antigravity / Cursor Configuration
In your MCP configuration file (`mcp_config.json`):
```json
{
  "mcpServers": {
    "qorvex-vgil": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer your_secure_mcp_api_key_here"
      }
    }
  }
}
```

---

## ☁️ Production Deployment (Railway)

The repository includes a ready-to-deploy `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Deployment Steps:
1. Initialize a private Git repository and commit the code (ensure `.env` is ignored):
   ```bash
   git init
   git add .
   git commit -m "feat: QORVEX VGIL Enterprise AI Connector MVP"
   ```
2. Link the repository to Railway.
3. Configure the following environment variables in the Railway Dashboard:
   - `PORT=3000`
   - `MCP_API_KEY=<generated-strong-secret>`
   - `LLM_BASE_URL=https://tokenharbor.ai/v1`
   - `LLM_API_KEY=<tokenharbor-api-key>`
   - `LLM_MODEL=deepseek-v4.1-flash:free`
4. Deploy and verify that `https://<your-railway-app>.up.railway.app/health` returns `HTTP 200` with `indexedRecords: 66`.

---

## 🛡 Security & Enterprise Compliance

- **No Secret Leakage**: The client-side UI contains zero credentials. Server endpoints sanitize and mask any internal keys.
- **DOM-safe Rendering**: User and AI text is rendered via secure DOM node constructors (`document.createElement`, `textContent`) avoiding HTML injection vulnerabilities.
- **Strict Citation Grounding**: The retrieval pipeline validates matches against verified URLs. Unsupported topics receive clear, polite disclosures that the VGIL portal does not document the query.

---

## 📄 License & Attribution

- **Organization**: Virtual Galaxy Infotech Limited (VGIL)
- **Portal Source**: [https://vgipl-website.vercel.app/](https://vgipl-website.vercel.app/)
- **Project**: QORVEX Enterprise AI Connector
