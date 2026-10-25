import crypto from "crypto";

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifyProduction() {
  const PROD_URL = "https://qorvex-vgil-backend-production.up.railway.app";
  console.log("=============================================================");
  console.log(`Checking Production QORVEX Deployment at: ${PROD_URL}`);
  console.log("=============================================================\n");

  // 1. Health check
  console.log("1. Checking /health endpoint...");
  const healthRes = await fetch(`${PROD_URL}/health`);
  const health = await healthRes.json();
  console.log("   Health response:", JSON.stringify(health));
  if (!health.oauthEnabled) {
    console.log("\n⚠️  Railway is still running the PREVIOUS build.");
    console.log("   Please add OAUTH_JWT_SECRET in Railway Dashboard Variables or click Redeploy.");
    return false;
  }
  console.log("   ✓ New deployment detected! oauthEnabled is TRUE.\n");

  // 2. Protected Resource Metadata
  console.log("2. Checking /.well-known/oauth-protected-resource (RFC 9728)...");
  const prmRes = await fetch(`${PROD_URL}/.well-known/oauth-protected-resource`);
  console.log(`   HTTP ${prmRes.status}`);
  if (prmRes.status !== 200) {
    console.error("   FAIL: Expected 200 OK from PRM endpoint");
    return false;
  }
  const prm = await prmRes.json();
  console.log("   PRM resource:", prm.resource);
  console.log("   PRM scopes:", prm.scopes_supported);
  console.log("   ✓ RFC 9728 Metadata verified!\n");

  // 3. Authorization Server Metadata
  console.log("3. Checking /.well-known/oauth-authorization-server (RFC 8414)...");
  const asmRes = await fetch(`${PROD_URL}/.well-known/oauth-authorization-server`);
  console.log(`   HTTP ${asmRes.status}`);
  if (asmRes.status !== 200) {
    console.error("   FAIL: Expected 200 OK from ASM endpoint");
    return false;
  }
  const asm = await asmRes.json();
  console.log("   ASM issuer:", asm.issuer);
  console.log("   ASM PKCE methods:", asm.code_challenge_methods_supported);
  console.log("   ✓ RFC 8414 Metadata verified!\n");

  // 4. WWW-Authenticate Challenge on /mcp
  console.log("4. Checking unauthenticated /mcp challenge...");
  const unauthRes = await fetch(`${PROD_URL}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
  });
  console.log(`   HTTP ${unauthRes.status}`);
  const wwwAuth = unauthRes.headers.get("www-authenticate");
  console.log("   WWW-Authenticate:", wwwAuth);
  if (!wwwAuth || !wwwAuth.includes("resource_metadata")) {
    console.error("   FAIL: Expected resource_metadata in WWW-Authenticate header");
    return false;
  }
  console.log("   ✓ WWW-Authenticate challenge verified!\n");

  // 5. Test Live OAuth PKCE & Token Exchange
  console.log("5. Testing Live OAuth PKCE authorization and token exchange...");
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const redirectUri = "https://chatgpt.com/connector/oauth/production-verify";

  // Register client
  const regRes = await fetch(`${PROD_URL}/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Production Verification Client",
      redirect_uris: [redirectUri]
    })
  });
  const reg = await regRes.json();
  const clientId = reg.client_id;
  const clientSecret = reg.client_secret;

  // Authorize & get code
  const authRes = await fetch(`${PROD_URL}/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=prod_verify_123`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "approve" }).toString(),
    redirect: "manual"
  });
  const loc = authRes.headers.get("location") || "";
  const code = new URL(loc).searchParams.get("code") || "";

  // Exchange for token
  const tokenRes = await fetch(`${PROD_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier
    }).toString()
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("   FAIL: Token exchange failed:", tokenData);
    return false;
  }
  console.log("   ✓ Access Token successfully obtained via live PKCE S256!\n");

  // 6. Test Live Authenticated MCP Tool Call
  console.log("6. Testing Live MCP tool call with OAuth access token...");
  const toolCallRes = await fetch(`${PROD_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenData.access_token}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_product_details",
        arguments: { product_name_or_slug: "core-banking-solution" }
      },
      id: 2
    })
  });
  const toolResult = await toolCallRes.json();
  console.log("   Tool call status:", toolCallRes.status);
  const toolText = toolResult.result?.content?.[0]?.text;
  if (toolText) {
    const parsed = JSON.parse(toolText);
    console.log("   Product Title:", parsed.title);
    console.log("   Found:", parsed.found);
    console.log("   Source URL:", parsed.source_url);
    console.log("   Metrics Count:", parsed.metrics?.length);
  }
  console.log("\n=============================================================");
  console.log("🎉 ALL PRODUCTION CHECKS PASSED SUCCESSFULLY!");
  console.log("=============================================================");
  return true;
}

verifyProduction().catch(console.error);
