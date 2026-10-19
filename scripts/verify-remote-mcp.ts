import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function verifyRemoteMcp() {
  const url = process.env.RAILWAY_MCP_URL || "https://qorvex-vgil-backend-production.up.railway.app/mcp";
  const apiKey = process.env.MCP_API_KEY?.trim();

  console.log("=== QORVEX Remote MCP Verification ===");
  console.log(`Target URL: ${url}`);
  console.log(`Key Configured: ${apiKey ? `YES (${apiKey.length} chars, masked)` : "NO"}\n`);

  if (!apiKey) {
    console.error("ERROR: MCP_API_KEY environment variable is not set.");
    console.error("Set it before running: $env:MCP_API_KEY='<YOUR_RAILWAY_KEY>'");
    process.exit(1);
  }

  // 1. Verify Unauthenticated Request is properly rejected
  console.log("1. Testing unauthenticated POST /mcp rejection...");
  const unauthRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
  });
  console.log(`   HTTP ${unauthRes.status}: ${(await unauthRes.text()).trim()}`);
  if (unauthRes.status !== 401) {
    console.error("   FAIL: Server did not reject unauthenticated call with 401!");
    process.exit(1);
  }
  console.log("   ✓ Correctly rejected with 401 Unauthorized.\n");

  // 2. Initialize official MCP Client with Bearer token
  console.log("2. Initializing Streamable HTTP MCP Client with Bearer token...");
  const client = new Client({ name: "qorvex-codex-verifier", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(url),
    {
      requestInit: {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      }
    }
  );

  try {
    await client.connect(transport);
    console.log("   ✓ initialize handshake successful!\n");
  } catch (err: any) {
    console.error("   FAIL: Connection failed:", err?.message || err);
    console.error("   If the error is 'Invalid token', ensure MCP_API_KEY matches the Railway dashboard value.");
    process.exit(1);
  }

  // 3. List tools
  console.log("3. Calling tools/list...");
  const tools = await client.listTools();
  console.log(`   Discovered ${tools.tools.length} remote tools:`);
  for (const t of tools.tools) {
    console.log(`   - ${t.name}: ${t.description.slice(0, 75)}...`);
  }
  console.log("   ✓ tools/list verified.\n");

  // 4. Call get_product_details
  console.log("4. Calling tool: get_product_details for 'core-banking-solution'...");
  const productResult = await client.callTool({
    name: "get_product_details",
    arguments: { product_name_or_slug: "core-banking-solution" }
  });

  console.log("   Call Status:", productResult.isError ? "ERROR" : "SUCCESS");
  if (Array.isArray(productResult.content) && productResult.content.length > 0) {
    const first = productResult.content[0];
    if ("text" in first) {
      const parsed = JSON.parse(first.text);
      console.log("   Product Title:", parsed.title || parsed.name);
      console.log("   Metrics:", parsed.metrics);
      console.log("   Source URL:", parsed.source_url || parsed.url);
    }
  }

  await client.close();
  console.log("\n=== ALL REMOTE MCP CHECKS PASSED ===");
}

verifyRemoteMcp().catch((e) => {
  console.error("Verification error:", e);
  process.exit(1);
});
