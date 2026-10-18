import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import path from "path";
import { z } from "zod";
import { knowledgeStore } from "./knowledge/store.js";
import { KnowledgeCategory } from "./knowledge/types.js";
import { handleChatMessage } from "./llm/chat.js";
import { tokenHarborClient } from "./llm/client.js";

const app = express();

// Secure CORS configuration
const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, MCP server-to-server calls, same-origin)
      if (!origin) return callback(null, true);

      // In local dev/test or if NODE_ENV is not production, allow localhost
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // Check configured allowed origins
      if (allowedOriginsEnv.includes(origin)) {
        return callback(null, true);
      }

      // Allow verified Vercel production and preview domains (*.vercel.app)
      try {
        const parsed = new URL(origin);
        if (
          parsed.protocol === "https:" &&
          (parsed.hostname.endsWith(".vercel.app") || parsed.hostname === "localhost")
        ) {
          return callback(null, true);
        }
      } catch {
        // invalid URL format
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.resolve(process.cwd(), "public")));
const PORT = Number(process.env.PORT ?? 3000);
const API_KEY = process.env.MCP_API_KEY?.trim();

app.get("/health", (_req, res) => res.json({
  ok: true,
  service: "qorvex-vgil-syncai-mcp",
  mode: process.env.NODE_ENV === "production" ? "production" : "production-mvp",
  indexedRecords: knowledgeStore.count,
  llmConfigured: tokenHarborClient.isConfigured(),
  llmModel: tokenHarborClient.getModel(),
  time: new Date().toISOString()
}));

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) return next(); // For local testing only; set key on Railway.
  const authHeader = req.header("authorization")?.trim() ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or malformed Bearer token" });
  }
  const token = authHeader.slice(7).trim();
  if (token !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
  next();
}

// REST API for direct search and knowledge retrieval
app.get("/api/search", (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const category = typeof req.query.category === "string" ? (req.query.category as KnowledgeCategory) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const results = knowledgeStore.search(query, { category, limit });
  return res.json({ query, category, count: results.length, results });
});

app.get("/api/knowledge/stats", (_req: Request, res: Response) => {
  const all = knowledgeStore.getAll();
  const categories = {
    company: all.filter(i => i.category === "company").length,
    product: all.filter(i => i.category === "product").length,
    service: all.filter(i => i.category === "service").length,
    resource: all.filter(i => i.category === "resource").length,
    investor: all.filter(i => i.category === "investor").length,
    career: all.filter(i => i.category === "career").length,
  };
  return res.json({ total: all.length, categories, source: "https://vgipl-website.vercel.app/" });
});

app.get("/api/knowledge/items", (req: Request, res: Response) => {
  const category = typeof req.query.category === "string" ? (req.query.category as KnowledgeCategory) : undefined;
  if (category) {
    return res.json(knowledgeStore.listByCategory(category));
  }
  return res.json(knowledgeStore.getAll());
});

// Grounded chat endpoint with TokenHarbor + DeepSeek
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message' in request body." });
    }
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({ error: "Message exceeds maximum allowed length of 1000 characters." });
    }

    const response = await handleChatMessage(trimmed);
    return res.json(response);
  } catch (err: any) {
    console.error("Chat endpoint error:", err.message);
    return res.status(500).json({ error: "Failed to process chat request", details: err.message });
  }
});

export function makeServer() {
  const server = new McpServer({ name: "qorvex-vgil-syncai", version: "0.2.0" });

  // Tool 1: search_company_info
  server.tool(
    "search_company_info",
    "Search official Virtual Galaxy Infotech Limited (VGIL) company information, achievements, financials, locations, leadership, products, and services from the indexed website.",
    {
      query: z.string().min(2).max(200).describe("Search query for VGIL company details, products, services, or financials"),
      category: z.enum(["company", "product", "service", "resource", "investor", "career"]).optional().describe("Optional category filter")
    },
    async ({ query, category }) => {
      const results = knowledgeStore.search(query, { category, limit: 5 });
      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              found: false,
              query,
              message: "No matching information found in the official VGIL knowledge base. Please try terms such as Core Banking, ERP, VGST, MIHAN, Nagpur, or NSE listing.",
              source_base: "https://vgipl-website.vercel.app/"
            }, null, 2)
          }]
        };
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            found: true,
            query,
            count: results.length,
            results: results.map((r) => ({
              title: r.title,
              category: r.category,
              url: r.url,
              excerpt: r.excerpt,
              metrics: r.metrics
            }))
          }, null, 2)
        }]
      };
    }
  );

  // Tool 2: get_product_details
  server.tool(
    "get_product_details",
    "Retrieve comprehensive specifications, features, metrics, and official source URL for any VGIL product (e.g. Core Banking Solution, ERP Solution, Digital Payments, IMIS, Conversational AI, etc.).",
    {
      product_name_or_slug: z.string().min(2).max(120).describe("Product name or slug (e.g. 'core-banking-solution', 'erp-solution', 'digital-payments', 'imis-solution', 'conversational-ai-companion')")
    },
    async ({ product_name_or_slug }) => {
      let product = knowledgeStore.getBySlug(product_name_or_slug, "product");
      if (!product) {
        const matches = knowledgeStore.search(product_name_or_slug, { category: "product", limit: 1, minScore: 15 });
        if (matches.length > 0) {
          product = knowledgeStore.getById(matches[0].id);
        }
      }

      if (!product) {
        const availableProducts = knowledgeStore.listByCategory("product").map((p) => ({ title: p.title, slug: p.slug }));
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              found: false,
              query: product_name_or_slug,
              message: "Product not found in VGIL's indexed catalogue.",
              available_products: availableProducts
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            found: true,
            product_id: product.id,
            title: product.title,
            subtitle: product.subtitle,
            source_url: product.url,
            summary: product.summary,
            features: product.features,
            metrics: product.metrics,
            full_description: product.content
          }, null, 2)
        }]
      };
    }
  );

  // Tool 3: summarize_service
  server.tool(
    "summarize_service",
    "Summarize official VGIL IT services and capabilities (e.g., Application Development, IT Infrastructure, VGST Smart Technology, DC & DR, Mobile Computing, AI & ML, Digital Solutions) with metrics and source URLs.",
    {
      service_name_or_slug: z.string().min(2).max(120).describe("Service name or slug (e.g., 'application-development', 'it-infrastructure-development', 'vgst', 'dc-dr', 'ai-ml', 'mobile-computing')")
    },
    async ({ service_name_or_slug }) => {
      let service = knowledgeStore.getBySlug(service_name_or_slug, "service");
      if (!service) {
        const matches = knowledgeStore.search(service_name_or_slug, { category: "service", limit: 1, minScore: 15 });
        if (matches.length > 0) {
          service = knowledgeStore.getById(matches[0].id);
        }
      }

      if (!service) {
        const availableServices = knowledgeStore.listByCategory("service").map((s) => ({ title: s.title, slug: s.slug }));
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              found: false,
              query: service_name_or_slug,
              message: "Service not found in VGIL's indexed catalogue.",
              available_services: availableServices
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            found: true,
            service_id: service.id,
            title: service.title,
            subtitle: service.subtitle,
            source_url: service.url,
            summary: service.summary,
            capabilities: service.features,
            metrics: service.metrics,
            full_description: service.content
          }, null, 2)
        }]
      };
    }
  );

  // Backwards-compatible tool: search_knowledge
  server.tool(
    "search_knowledge",
    "Search indexed VGIL website knowledge base (company, products, services, investor relations, resources).",
    { query: z.string().min(2).max(200) },
    async ({ query }) => {
      const results = knowledgeStore.search(query, { limit: 5 });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            source: "VGIL Official Website Index (https://vgipl-website.vercel.app)",
            query,
            count: results.length,
            results: results.map((r) => ({
              id: r.id,
              title: r.title,
              category: r.category,
              url: r.url,
              excerpt: r.excerpt
            }))
          }, null, 2)
        }]
      };
    }
  );

  // Backwards-compatible tool: get_project_status
  server.tool(
    "get_project_status",
    "Return illustrative project status for a demo; not connected to a real project system.",
    { project_name: z.string().min(2).max(120) },
    async ({ project_name }) => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          source: "SAMPLE DEMO DATA — not real company information",
          project_name,
          status: "In progress",
          completion: "65% (illustrative)",
          open_items: ["Complete integration testing", "Review test evidence", "Obtain release checklist approval"],
          next_step: "Demo delivery lead to review open items",
          note: "No live project system is connected."
        }, null, 2)
      }]
    })
  );

  // Backwards-compatible tool: create_report
  server.tool(
    "create_report",
    "Format a draft report from notes supplied by the user. Does not save or send anything.",
    { title: z.string().min(2).max(120), notes: z.array(z.string().min(1).max(1000)).min(1).max(30) },
    async ({ title, notes }) => ({
      content: [{
        type: "text",
        text: [`# ${title}`, "", "## Summary", ...notes.map((n, i) => `${i + 1}. ${n}`), "", "Draft generated by QORVEX / VGIL SyncAI demo. Verify facts before sharing."].join("\n")
      }]
    })
  );

  return server;
}

app.post("/mcp", requireApiKey, async (req: Request, res: Response) => {
  const server = makeServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed", err);
    if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
  }
});

app.get("/mcp", requireApiKey, (_req, res) => res.status(405).set("Allow", "POST").json({ error: "Use POST for this stateless MCP endpoint." }));
app.delete("/mcp", requireApiKey, (_req, res) => res.status(405).set("Allow", "POST").json({ error: "Stateless demo endpoint does not support DELETE." }));

if (!process.argv[1]?.includes("test")) {
  app.listen(PORT, () => console.log(`QORVEX / VGIL SyncAI MCP demo listening on ${PORT}`));
}

export { app };
