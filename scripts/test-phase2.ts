import { knowledgeStore } from "../src/knowledge/store.js";
import { makeServer } from "../src/index.js";

async function runTests() {
  console.log("==========================================");
  console.log("QORVEX / VGIL SyncAI — Phase 2 Verification");
  console.log("==========================================");

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

  // Test 1: KnowledgeStore loaded
  console.log("\n--- Test 1: Knowledge Base Store ---");
  assert(knowledgeStore.count >= 60, `KnowledgeStore contains ${knowledgeStore.count} records (expected >= 60)`);

  const products = knowledgeStore.listByCategory("product");
  assert(products.length === 17, `Indexed products count is ${products.length} (expected 17)`);

  const services = knowledgeStore.listByCategory("service");
  assert(services.length === 7, `Indexed services count is ${services.length} (expected 7)`);

  // Test 2: Search relevance
  console.log("\n--- Test 2: Keyword Search Relevance ---");
  const cbsResults = knowledgeStore.search("core banking solution");
  assert(cbsResults.length > 0, "Search for 'core banking solution' returned results");
  assert(cbsResults[0].slug === "core-banking-solution", `Top result slug is '${cbsResults[0].slug}'`);
  assert(cbsResults[0].url === "https://vgipl-website.vercel.app/products/core-banking-solution", `Source URL is valid: ${cbsResults[0].url}`);

  const vgstResults = knowledgeStore.search("VGST smart technology");
  assert(vgstResults.length > 0, "Search for 'VGST smart technology' returned results");
  assert(vgstResults[0].slug === "vgst", `Top result slug is '${vgstResults[0].slug}'`);

  const nagpurResults = knowledgeStore.search("Nagpur MIHAN SEZ");
  assert(nagpurResults.length > 0, "Search for 'Nagpur MIHAN SEZ' returned results");

  const unknownResults = knowledgeStore.search("quantum teleportation martian spaceship warp");
  assert(unknownResults.length === 0, `Search for non-existent terms returned 0 results (${unknownResults.length})`);

  // Test 3: MCP Server Tools
  console.log("\n--- Test 3: MCP Server Tools ---");
  const server = makeServer();
  // Server exposes tools: search_company_info, get_product_details, summarize_service, search_knowledge
  const tools = (server as any)._registeredTools;
  assert(Boolean(tools["search_company_info"]), "Tool 'search_company_info' is registered");
  assert(Boolean(tools["get_product_details"]), "Tool 'get_product_details' is registered");
  assert(Boolean(tools["summarize_service"]), "Tool 'summarize_service' is registered");
  assert(Boolean(tools["search_knowledge"]), "Tool 'search_knowledge' is registered");

  // Execute search_company_info
  const compInfoHandler = tools["search_company_info"].handler;
  const compRes = await compInfoHandler({ query: "headquarters Nagpur office" });
  const compJson = JSON.parse(compRes.content[0].text);
  assert(compJson.found === true, "search_company_info found company info");
  assert(compJson.results.length > 0, `search_company_info returned ${compJson.results.length} results`);
  assert(compJson.results[0].url.startsWith("https://vgipl-website.vercel.app"), "Result contains real VGIL source URL");

  // Execute get_product_details
  const prodHandler = tools["get_product_details"].handler;
  const prodRes = await prodHandler({ product_name_or_slug: "core-banking-solution" });
  const prodJson = JSON.parse(prodRes.content[0].text);
  assert(prodJson.found === true, "get_product_details found Core Banking Solution");
  assert(prodJson.features && prodJson.features.length > 0, "Product features populated from VGIL website");
  assert(prodJson.metrics && prodJson.metrics.length > 0, "Product metrics populated from VGIL website");
  assert(prodJson.source_url === "https://vgipl-website.vercel.app/products/core-banking-solution", "Product source URL matched");

  // Execute get_product_details with unknown product
  const unkProdRes = await prodHandler({ product_name_or_slug: "nonexistent-super-gadget" });
  const unkProdJson = JSON.parse(unkProdRes.content[0].text);
  assert(unkProdJson.found === false, "Unknown product correctly returned found=false without fabricating");
  assert(Array.isArray(unkProdJson.available_products), "Unknown product returned list of real available products");

  // Execute summarize_service
  const servHandler = tools["summarize_service"].handler;
  const servRes = await servHandler({ service_name_or_slug: "application-development" });
  const servJson = JSON.parse(servRes.content[0].text);
  assert(servJson.found === true, "summarize_service found Application Development");
  assert(servJson.source_url === "https://vgipl-website.vercel.app/services/application-development", "Service source URL matched");

  // Execute summarize_service with unknown service
  const unkServRes = await servHandler({ service_name_or_slug: "space-travel-service" });
  const unkServJson = JSON.parse(unkServRes.content[0].text);
  assert(unkServJson.found === false, "Unknown service correctly returned found=false without fabricating");

  console.log("\n==========================================");
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
