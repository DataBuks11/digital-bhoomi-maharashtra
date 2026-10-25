import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const BASE_URL = "https://vgipl-website.vercel.app";
const BUNDLE_URL = `${BASE_URL}/assets/index-B4lbizyL.js`;
const OUTPUT_FILE = path.resolve(process.cwd(), "data", "vgil-knowledge.json");
const LOCAL_BUNDLE = path.resolve(process.cwd(), "bundle.js");

export type KnowledgeCategory =
  | "company"
  | "product"
  | "service"
  | "resource"
  | "investor"
  | "career";

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  slug: string;
  title: string;
  subtitle?: string;
  url: string;
  summary: string;
  content: string;
  features?: Array<{ title: string; description: string }>;
  metrics?: Array<{ value: string; label: string }>;
  tags: string[];
  lastUpdated: string;
}

function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.on("error", reject);
  });
}

async function verifyUrl(url: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith("https") ? https : http;
      const req = client.get(url, { timeout: timeoutMs }, (res) => {
        resolve(Boolean(res.statusCode && res.statusCode < 400));
        res.resume(); // consume response
      });
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.on("error", () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

function extractArray(content: string, startMarker: string): string | null {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return null;
  const slice = content.substring(startIdx + startMarker.length);
  let depth = 1;
  let inString = false;
  let quoteChar = "";
  let inBacktick = false;
  let escape = false;
  let endIdx = -1;

  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (inBacktick) { if (ch === "`") inBacktick = false; continue; }
    if (inString) { if (ch === quoteChar) inString = false; continue; }
    if (ch === "`") { inBacktick = true; continue; }
    if (ch === '"' || ch === "'") { inString = true; quoteChar = ch; continue; }
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) { endIdx = i + 1; break; }
    }
  }
  return endIdx !== -1 ? "[" + slice.substring(0, endIdx) : null;
}

function parseJsArray<T>(rawStr: string | null): T[] {
  if (!rawStr) return [];
  try {
    const cleaned = rawStr.replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)(?=[,\}\]\n\r\s])/g, (match, id) => {
      if (["true", "false", "null", "undefined"].includes(id)) return match;
      return `: "${id}"`;
    });
    return new Function(`return (${cleaned})`)();
  } catch (err) {
    console.error("Failed to parse JS array slice:", err);
    return [];
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function generateTags(...sources: (string | undefined)[]): string[] {
  const stopWords = new Set(["and", "the", "for", "with", "from", "that", "this", "our", "are", "all", "its"]);
  const tokens = new Set<string>();
  for (const src of sources) {
    if (!src) continue;
    const words = src.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w)) {
        tokens.add(w);
      }
    }
  }
  return Array.from(tokens);
}

export async function runIngestion() {
  console.log("=========================================");
  console.log("QORVEX — VGIL Website Ingestion Pipeline");
  console.log("=========================================");

  let bundleContent = "";
  try {
    console.log(`[1/4] Fetching latest JS bundle from ${BUNDLE_URL}...`);
    bundleContent = await fetchText(BUNDLE_URL, 15000);
    console.log(`Successfully downloaded bundle (${bundleContent.length} bytes).`);
  } catch (err) {
    console.warn(`Direct download failed: ${(err as Error).message}. Checking local bundle fallback...`);
    if (fs.existsSync(LOCAL_BUNDLE)) {
      bundleContent = fs.readFileSync(LOCAL_BUNDLE, "utf-8");
      console.log(`Using cached local bundle (${bundleContent.length} bytes).`);
    } else {
      throw new Error("Unable to retrieve VGIL bundle from remote or local storage.");
    }
  }

  const items: KnowledgeItem[] = [];
  const timestamp = new Date().toISOString();

  // 1. Company Overview Records
  console.log("[2/4] Extracting company overview, leadership, and contact data...");
  items.push({
    id: "COMP-overview",
    category: "company",
    slug: "about",
    title: "Virtual Galaxy Infotech Limited (VGIL) - Overview",
    subtitle: "Leading IT Solutions Provider & Financial Enterprise Software Pioneer",
    url: `${BASE_URL}/about`,
    summary: "Virtual Galaxy Infotech Limited (VGIL), incorporated in 1997, is a premier banking and financial technology enterprise headquartered in Nagpur, Maharashtra, India. VGIL is officially listed on NSE India after an IPO that attracted ₹14,440 Cr in bids.",
    content: cleanText(`
      Virtual Galaxy Infotech Limited (VGIL) is an Indian information technology company incorporated in 1997 (CIN: L93000MH1997PLC110645).
      The company specializes in Core Banking Solutions (CBS E-Banker), ERP solutions, cloud computing, cyber security, digital lending, and IT infrastructure.
      VGIL operates its flagship Software Development Centre at MIHAN SEZ in Nagpur, Maharashtra.
      Key Achievements & Metrics:
      - Total banks served: 200+ financial institutions and banks across India and internationally.
      - Transactions processed: Over 30 Billion+ cumulative transactions.
      - Accounts managed: 10 Million+ accounts powered by VGIL systems.
      - Average transaction processing time: 10 milliseconds with 99.9% uptime SLA.
      - Stock exchange listing: Listed on the National Stock Exchange of India (NSE India) following a ₹93.29 Cr IPO that received bids worth ₹14,440 Cr.
      - International footprint: Landmark mandates including Botswana Development Corporation and global contracts exceeding $1.1 Million.
      - Recognitions: Sardar Patel Unity Award for Leading IT Solutions Provider of the Year.
    `),
    metrics: [
      { value: "1997", label: "Year Incorporated" },
      { value: "200+", label: "Banks Served" },
      { value: "30B+", label: "Transactions Processed" },
      { value: "10M+", label: "Accounts Managed" },
      { value: "99.9%", label: "System Uptime" },
      { value: "₹14,440 Cr", label: "IPO Bids Received" }
    ],
    tags: generateTags("Virtual Galaxy Infotech Limited", "VGIL", "overview", "banking", "NSE", "Nagpur", "MIHAN", "history", "milestones"),
    lastUpdated: timestamp
  });

  items.push({
    id: "COMP-contact-offices",
    category: "company",
    slug: "contact",
    title: "Virtual Galaxy Infotech Limited - Offices & Contact Information",
    subtitle: "Registered Office, Corporate Office, Development Centre & Communications",
    url: `${BASE_URL}/contact`,
    summary: "Official contact channels, registered office in Vivekanand Nagar Nagpur, corporate office at Chhatrapati Square Ring Road, and MIHAN SEZ Development Centre.",
    content: cleanText(`
      Virtual Galaxy Infotech Limited Contact Channels & Office Addresses:
      1. Registered Office:
         Plot No. 26, The Nagpur Divisional Insurance Employees Co-operative Housing Society Limited, Vivekanand Nagar, Nagpur, Maharashtra, India - 440015.
      2. Corporate Office / Operations:
         3, Central Excise Colony, Chhatrapati Square, Ring Road, Nagpur – 440015, Maharashtra, India.
      3. Software Development Centre:
         MIHAN SEZ Development Centre, Nagpur, Maharashtra.
      4. Email Addresses:
         - General Inquiries: info@vginfotech.ai / info@vgipl.in
         - Pre-sales & Business: presales@vginfotech.ai
         - Investor Relations: investors@vginfotech.ai
         - Company Secretary: company.secretary@vginfotech.ai
         - Careers & HR: careers@vgipl.in / hr@vginfotech.ai
         - Customer Service Head: cs.head@vgipl.in
         - RBI Nodal Officer: rbi.nodalofficer@vgipl.in
      5. Corporate Identification Number (CIN): L93000MH1997PLC110645.
    `),
    tags: generateTags("contact", "address", "Nagpur", "Vivekanand Nagar", "Chhatrapati Square", "MIHAN SEZ", "email", "phone", "CIN", "presales", "investors"),
    lastUpdated: timestamp
  });

  // 2. Extract Products (hr array)
  console.log("[2/4] Extracting products...");
  const rawProducts = parseJsArray<any>(extractArray(bundleContent, ",hr=["));
  for (const p of rawProducts) {
    if (!p.slug || !p.title) continue;
    const prodUrl = `${BASE_URL}/products/${p.slug}`;
    const featureText = (p.features || []).map((f: any) => `${f.title}: ${f.description}`).join(". ");
    const metricText = (p.metrics || []).map((m: any) => `${m.label}: ${m.value}`).join(", ");
    const content = cleanText(`
      ${p.title} (${p.subtitle || ""}).
      ${p.shortDescription || p.description || ""}
      ${featureText ? `Key Features: ${featureText}` : ""}
      ${metricText ? `Metrics & Track Record: ${metricText}` : ""}
    `);

    items.push({
      id: `PROD-${p.slug}`,
      category: "product",
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      url: prodUrl,
      summary: cleanText(p.shortDescription || p.description || p.subtitle || p.title),
      content,
      features: p.features || [],
      metrics: p.metrics || [],
      tags: generateTags(p.title, p.subtitle, p.slug, "product", ...(p.features || []).map((f: any) => f.title)),
      lastUpdated: timestamp
    });
  }
  console.log(`Extracted ${rawProducts.length} products.`);

  // 3. Extract Services (gr array)
  console.log("[2/4] Extracting services...");
  const rawServices = parseJsArray<any>(extractArray(bundleContent, ",gr=["));
  for (const s of rawServices) {
    if (!s.slug || !s.title) continue;
    const servUrl = `${BASE_URL}/services/${s.slug}`;
    const featureText = (s.features || []).map((f: any) => `${f.title}: ${f.description}`).join(". ");
    const metricText = (s.metrics || []).map((m: any) => `${m.label}: ${m.value}`).join(", ");
    const content = cleanText(`
      ${s.title} (${s.subtitle || ""}).
      ${s.description || ""}
      ${s.longDescription || ""}
      ${featureText ? `Core Capabilities: ${featureText}` : ""}
      ${metricText ? `Service Metrics: ${metricText}` : ""}
    `);

    items.push({
      id: `SERV-${s.slug}`,
      category: "service",
      slug: s.slug,
      title: s.title,
      subtitle: s.subtitle,
      url: servUrl,
      summary: cleanText(s.description || s.subtitle || s.title),
      content,
      features: s.features || [],
      metrics: s.metrics || [],
      tags: generateTags(s.title, s.subtitle, s.slug, "service", ...(s.features || []).map((f: any) => f.title)),
      lastUpdated: timestamp
    });
  }
  console.log(`Extracted ${rawServices.length} services.`);

  // 4. Extract Investor Sections (jr array)
  console.log("[2/4] Extracting investor relations and governance...");
  const rawInvestors = parseJsArray<any>(extractArray(bundleContent, ",jr=["));
  for (const inv of rawInvestors) {
    if (!inv.slug || !inv.title) continue;
    const invUrl = `${BASE_URL}/investors/${inv.slug}`;
    const gridText = (inv.gridItems || []).map((g: any) => g.title).join(", ");
    const content = cleanText(`
      ${inv.title}. ${inv.desc || ""}
      ${gridText ? `Components & Sections: ${gridText}.` : ""}
    `);

    items.push({
      id: `INV-${inv.slug}`,
      category: "investor",
      slug: inv.slug,
      title: inv.title,
      subtitle: "Investor Relations & Corporate Governance",
      url: invUrl,
      summary: cleanText(inv.desc || `${inv.title} at Virtual Galaxy Infotech Limited`),
      content,
      tags: generateTags(inv.title, inv.slug, "investor", "governance", "NSE"),
      lastUpdated: timestamp
    });
  }
  console.log(`Extracted ${rawInvestors.length} investor categories.`);

  // 5. Extract Resources & Blogs (Rr array)
  console.log("[2/4] Extracting knowledge resources and blogs...");
  const rawResources = parseJsArray<any>(extractArray(bundleContent, ",Rr=["));
  for (const res of rawResources) {
    if (res.gridItems && Array.isArray(res.gridItems)) {
      for (const item of res.gridItems) {
        if (!item.title) continue;
        const itemSlug = item.slug || (item.link ? item.link.replace(/^\//, "").replace(/\//g, "-") : undefined);
        const itemUrl = item.link?.startsWith("http")
          ? item.link
          : (item.link ? `${BASE_URL}${item.link}` : `${BASE_URL}/resource/${res.slug}`);

        items.push({
          id: `RES-${itemSlug || Math.random().toString(36).substring(7)}`,
          category: "resource",
          slug: itemSlug || res.slug,
          title: item.title,
          subtitle: res.title,
          url: itemUrl,
          summary: cleanText(item.desc || item.title),
          content: cleanText(`${item.title}. ${item.desc || ""} ${item.content || ""}`),
          tags: generateTags(item.title, res.title, "resource", item.type),
          lastUpdated: timestamp
        });
      }
    }
  }
  console.log(`Extracted ${items.filter(i => i.category === "resource").length} knowledge resource items.`);

  // 6. Extract Careers (zr array)
  console.log("[2/4] Extracting career and workplace information...");
  const rawCareers = parseJsArray<any>(extractArray(bundleContent, ",zr=["));
  for (const c of rawCareers) {
    if (!c.slug || !c.title) continue;
    items.push({
      id: `CAR-${c.slug}`,
      category: "career",
      slug: c.slug,
      title: c.title,
      subtitle: "Careers at Virtual Galaxy Infotech",
      url: `${BASE_URL}/careers/${c.slug}`,
      summary: cleanText(c.description || c.title),
      content: cleanText(`${c.title}. ${c.description || ""}`),
      tags: generateTags(c.title, c.slug, "career", "jobs", "culture"),
      lastUpdated: timestamp
    });
  }

  // 7. Verify Unique Source URLs
  console.log("[3/4] Verifying reachable public URLs against VGIL website...");
  const distinctUrls = Array.from(new Set(items.map(i => i.url)));
  const verifiedUrls = new Set<string>();
  const failedUrls: string[] = [];

  // Verify representative URLs batch
  for (const url of distinctUrls) {
    if (!url.startsWith(BASE_URL)) {
      // External links like facebook posts
      verifiedUrls.add(url);
      continue;
    }
    const ok = await verifyUrl(url, 4000);
    if (ok) {
      verifiedUrls.add(url);
    } else {
      failedUrls.push(url);
    }
  }

  console.log(`Verified ${verifiedUrls.size}/${distinctUrls.length} unique URLs.`);
  if (failedUrls.length > 0) {
    console.warn(`Unverified / Inaccessible URLs (${failedUrls.length}):`, failedUrls.slice(0, 5));
  }

  // 8. Deduplicate and Save
  console.log("[4/4] Deduplicating and writing knowledge base...");
  const uniqueItemsMap = new Map<string, KnowledgeItem>();
  for (const it of items) {
    const key = `${it.category}:${it.slug}:${it.title}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, it);
    }
  }
  const finalizedItems = Array.from(uniqueItemsMap.values());

  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalizedItems, null, 2), "utf-8");
  console.log(`Saved ${finalizedItems.length} indexed records to ${OUTPUT_FILE}`);
  console.log("Ingestion completed successfully!");
  return {
    totalRecords: finalizedItems.length,
    byCategory: {
      company: finalizedItems.filter(i => i.category === "company").length,
      product: finalizedItems.filter(i => i.category === "product").length,
      service: finalizedItems.filter(i => i.category === "service").length,
      resource: finalizedItems.filter(i => i.category === "resource").length,
      investor: finalizedItems.filter(i => i.category === "investor").length,
      career: finalizedItems.filter(i => i.category === "career").length
    },
    verifiedUrls: verifiedUrls.size,
    failedUrls: failedUrls.length
  };
}

// Direct execution
if (process.argv[1]?.includes("ingest-vgil")) {
  runIngestion().catch((err) => {
    console.error("Ingestion failed:", err);
    process.exit(1);
  });
}
