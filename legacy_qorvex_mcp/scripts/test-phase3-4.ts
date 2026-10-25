import "dotenv/config";
import { app } from "../src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import http from "http";

async function runPhase3and4Tests() {
  console.log("=================================================");
  console.log("QORVEX — Phase 3 (MCP) & Phase 4 (LLM) Test Suite");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  const TEST_PORT = 3100;
  const TEST_API_KEY = process.env.MCP_API_KEY || "qorvex-test-key-2026";
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`Test server running on port ${TEST_PORT}`);

  try {
    // -------------------------------------------------------------
    // PHASE 3: MCP PROTOCOL & TRANSPORT VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- Phase 3: MCP Security, Transport & Tools ---");

    // 1. Test MCP Authorization: Unauthorized when key is missing or wrong
    const unauthRes = await fetch(`http://localhost:${TEST_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(unauthRes.status === 401, `POST /mcp without Authorization returned HTTP 401 (${unauthRes.status})`);

    const badAuthRes = await fetch(`http://localhost:${TEST_PORT}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer wrong-key-xyz"
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(badAuthRes.status === 401, `POST /mcp with invalid token returned HTTP 401 (${badAuthRes.status})`);

    // 2. Test MCP Client connection using StreamableHTTPClientTransport
    console.log("Connecting official MCP client with StreamableHTTPClientTransport...");
    const client = new Client({ name: "qorvex-test-client", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://localhost:${TEST_PORT}/mcp`),
      {
        requestInit: {
          headers: {
            "Authorization": `Bearer ${TEST_API_KEY}`
          }
        }
      }
    );

    await client.connect(transport);
    assert(true, "MCP client connected successfully over Streamable HTTP transport");

    // 3. Test tools/list
    const toolsList = await client.listTools();
    const toolNames = toolsList.tools.map((t) => t.name);
    console.log("Registered MCP tools:", toolNames.join(", "));
    assert(toolNames.includes("search_company_info"), "Tools list includes search_company_info");
    assert(toolNames.includes("get_product_details"), "Tools list includes get_product_details");
    assert(toolNames.includes("summarize_service"), "Tools list includes summarize_service");
    assert(toolNames.includes("search_knowledge"), "Tools list includes search_knowledge");

    // 4. Test tools/call: search_company_info
    const compResult: any = await client.callTool({
      name: "search_company_info",
      arguments: { query: "Nagpur MIHAN SEZ" }
    });
    assert(Array.isArray(compResult.content), "search_company_info returned content array");
    const compText = compResult.content[0].text;
    const compParsed = JSON.parse(compText);
    assert(compParsed.found === true, "search_company_info found results for 'Nagpur MIHAN SEZ'");
    assert(compParsed.results[0].url.startsWith("https://vgipl-website.vercel.app"), "Result contains verified VGIL website URL");

    // 5. Test tools/call: get_product_details
    const prodResult: any = await client.callTool({
      name: "get_product_details",
      arguments: { product_name_or_slug: "core-banking-solution" }
    });
    const prodParsed = JSON.parse(prodResult.content[0].text);
    assert(prodParsed.found === true, "get_product_details found Core Banking Solution");
    assert(prodParsed.source_url === "https://vgipl-website.vercel.app/products/core-banking-solution", "Source URL matches official product page");
    assert(prodParsed.metrics.length > 0, `Product has ${prodParsed.metrics.length} real metrics (e.g. 200+ banks, 30B+ transactions)`);

    // 6. Test tools/call: summarize_service
    const servResult: any = await client.callTool({
      name: "summarize_service",
      arguments: { service_name_or_slug: "vgst" }
    });
    const servParsed = JSON.parse(servResult.content[0].text);
    assert(servParsed.found === true, "summarize_service found VGST");
    assert(servParsed.source_url === "https://vgipl-website.vercel.app/services/vgst", "VGST source URL verified");

    await client.close();
    assert(true, "MCP client closed cleanly");

    // -------------------------------------------------------------
    // PHASE 4: TOKENHARBOR + DEEPSEEK CHAT & RETRIEVAL VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- Phase 4: TokenHarbor + DeepSeek Grounded Chat ---");

    // 1. Validation test: Missing / invalid message
    const emptyMsgRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert(emptyMsgRes.status === 400, `POST /api/chat with empty body returned HTTP 400 (${emptyMsgRes.status})`);

    const longMsg = "a".repeat(1005);
    const longMsgRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: longMsg })
    });
    assert(longMsgRes.status === 400, `POST /api/chat exceeding length returned HTTP 400 (${longMsgRes.status})`);

    // 2. Unknown question test: Zero-hallucination handling
    console.log("Testing unknown question handling...");
    const unkChatRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "quantum teleportation and martian colony terraforming" })
    });
    assert(unkChatRes.status === 200, `Unknown question returned HTTP 200 (${unkChatRes.status})`);
    const unkChatData: any = await unkChatRes.json();
    assert(unkChatData.retrieval.grounded === false, "Unknown question retrieval grounded status is false");
    assert(unkChatData.sources.length === 0, "Unknown question returned empty sources array");
    assert(unkChatData.answer.includes("does not contain"), "Unknown question clearly states absence of records without fabricating");

    // 3. Grounded chat question with live TokenHarbor + DeepSeek V4.1 Flash
    console.log("Testing live grounded query with DeepSeek V4.1 Flash via TokenHarbor...");
    const chatQuery = "What core banking solution does Virtual Galaxy Infotech offer, and what is its scale?";
    const chatRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatQuery })
    });
    assert(chatRes.status === 200, `POST /api/chat returned HTTP 200 (${chatRes.status})`);
    const chatData: any = await chatRes.json();

    assert(chatData.retrieval.grounded === true, "Retrieval grounded is true for valid question");
    assert(chatData.sources.length > 0, `Chat returned ${chatData.sources.length} sources`);
    assert(chatData.sources[0].url.startsWith("https://vgipl-website.vercel.app"), "Source URL is official VGIL URL");
    assert(typeof chatData.answer === "string" && chatData.answer.length > 50, "Received detailed response from DeepSeek");
    console.log("\nSample DeepSeek Grounded Answer excerpt:");
    console.log(chatData.answer.substring(0, 300) + "...\n");

    // 4. API Key Protection: Ensure no secrets leak in API response
    const rawChatText = JSON.stringify(chatData);
    const apiKey = process.env.LLM_API_KEY || "";
    const hasSecretLeak = apiKey.length > 10 && rawChatText.includes(apiKey);
    assert(!hasSecretLeak, "Zero secret leakage: LLM_API_KEY is not exposed in /api/chat response");

    const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
    const healthJson = await healthRes.json();
    assert(healthJson.ok === true && healthJson.indexedRecords === 66, "Health check verifies 66 indexed records");
    assert(!JSON.stringify(healthJson).includes(apiKey), "Zero secret leakage in /health endpoint");

  } finally {
    server.close();
    console.log("Test server terminated cleanly.");
  }

  console.log("\n=================================================");
  console.log(`PHASE 3 & 4 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3and4Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
