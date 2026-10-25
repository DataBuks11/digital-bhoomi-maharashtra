import "dotenv/config";
import crypto from "crypto";
import http from "http";
import { app } from "../src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { oauthService } from "../src/auth/oauth.js";

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function runOAuthAndChatGPTTests() {
  console.log("===============================================================");
  console.log("QORVEX — OAuth 2.1 PKCE & ChatGPT Custom MCP Compatibility Test");
  console.log("===============================================================");

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

  const TEST_PORT = 3105;
  const baseUrl = `http://localhost:${TEST_PORT}`;
  const TEST_API_KEY = process.env.MCP_API_KEY || "qorvex-test-key-2026";
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`Test server active on port ${TEST_PORT}\n`);

  try {
    // -------------------------------------------------------------
    // SECTION 1: METADATA & DISCOVERY (RFC 9728 & RFC 8414)
    // -------------------------------------------------------------
    console.log("--- 1. OAuth Discovery & Metadata Endpoints ---");

    // 1.1 Protected Resource Metadata (RFC 9728)
    const prmRes = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
    assert(prmRes.status === 200, `GET /.well-known/oauth-protected-resource returns 200 (${prmRes.status})`);
    const prm = await prmRes.json();
    assert(typeof prm.resource === "string" && prm.resource.includes("/mcp"), `PRM specifies resource URL: ${prm.resource}`);
    assert(Array.isArray(prm.authorization_servers) && prm.authorization_servers.length > 0, "PRM lists authorization_servers");
    assert(prm.bearer_methods_supported.includes("header"), "PRM indicates Bearer header supported");
    assert(prm.scopes_supported.includes("mcp:read") && prm.scopes_supported.includes("mcp:write"), "PRM includes mcp:read and mcp:write scopes");

    // 1.2 Authorization Server Metadata (RFC 8414)
    const asmRes = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    assert(asmRes.status === 200, `GET /.well-known/oauth-authorization-server returns 200 (${asmRes.status})`);
    const asm = await asmRes.json();
    assert(typeof asm.issuer === "string" && asm.issuer.length > 0, `ASM issuer is configured: ${asm.issuer}`);
    assert(asm.authorization_endpoint.endsWith("/oauth/authorize"), "ASM authorization_endpoint is /oauth/authorize");
    assert(asm.token_endpoint.endsWith("/oauth/token"), "ASM token_endpoint is /oauth/token");
    assert(asm.registration_endpoint.endsWith("/oauth/register"), "ASM registration_endpoint is /oauth/register");
    assert(asm.revocation_endpoint.endsWith("/oauth/revoke"), "ASM revocation_endpoint is /oauth/revoke");
    assert(Array.isArray(asm.code_challenge_methods_supported) && asm.code_challenge_methods_supported.includes("S256"), "ASM declares PKCE S256 support");
    assert(asm.response_types_supported.includes("code"), "ASM declares response_types_supported includes 'code'");
    assert(asm.grant_types_supported.includes("authorization_code") && asm.grant_types_supported.includes("refresh_token"), "ASM declares authorization_code and refresh_token grants");

    // 1.3 OpenID Configuration Alias
    const oidcRes = await fetch(`${baseUrl}/.well-known/openid-configuration`);
    assert(oidcRes.status === 200, `GET /.well-known/openid-configuration returns 200 (${oidcRes.status})`);
    const oidc = await oidcRes.json();
    assert(oidc.issuer === asm.issuer, "OpenID configuration issuer matches authorization server");

    // -------------------------------------------------------------
    // SECTION 2: DYNAMIC CLIENT REGISTRATION (RFC 7591)
    // -------------------------------------------------------------
    console.log("\n--- 2. Dynamic Client Registration (RFC 7591) ---");

    // 2.1 Successful registration with ChatGPT connector redirect URI
    const validRedirectUri = "https://chatgpt.com/connector/oauth/test-connector-uuid";
    const regRes = await fetch(`${baseUrl}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "ChatGPT Web Custom Connector",
        redirect_uris: [validRedirectUri],
        scope: "mcp:read mcp:write"
      })
    });
    assert(regRes.status === 201, `POST /oauth/register returns 201 Created (${regRes.status})`);
    const regData = await regRes.json();
    assert(typeof regData.client_id === "string" && regData.client_id.startsWith("client_"), "Client registration returned valid client_id");
    assert(typeof regData.client_secret === "string", "Client registration returned client_secret");
    assert(regData.redirect_uris.includes(validRedirectUri), "Registered client includes ChatGPT redirect URI");

    const clientId = regData.client_id;
    const clientSecret = regData.client_secret;

    // 2.2 Rejection of registration with insecure/invalid redirect URI
    const badRegRes = await fetch(`${baseUrl}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Insecure Client",
        redirect_uris: ["http://malicious-site.example/callback"]
      })
    });
    assert(badRegRes.status === 400, `POST /oauth/register rejects non-HTTPS insecure redirect URI (${badRegRes.status})`);

    // -------------------------------------------------------------
    // SECTION 3: OAUTH 2.1 AUTHORIZATION FLOW WITH PKCE S256
    // -------------------------------------------------------------
    console.log("\n--- 3. OAuth 2.1 PKCE S256 Authorization Flow ---");

    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = base64url(crypto.randomBytes(32));
    const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
    const oauthState = `state_${base64url(crypto.randomBytes(16))}`;

    // 3.1 Consent UI GET
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: validRedirectUri,
      scope: "mcp:read mcp:write",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: oauthState,
      resource: `${baseUrl}/mcp`
    });

    const consentRes = await fetch(`${baseUrl}/oauth/authorize?${authParams.toString()}`);
    assert(consentRes.status === 200, `GET /oauth/authorize returns 200 consent page (${consentRes.status})`);
    const consentHtml = await consentRes.text();
    assert(consentHtml.includes("Authorize QORVEX"), "Consent page contains authorization title");
    assert(consentHtml.includes("mcp:read") && consentHtml.includes("mcp:write"), "Consent page describes requested scopes");

    // 3.2 Authorization Consent Submission (Approve)
    const approveRes = await fetch(`${baseUrl}/oauth/authorize?${authParams.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "approve" }).toString(),
      redirect: "manual"
    });
    assert(approveRes.status === 302, `POST /oauth/authorize returns 302 redirect (${approveRes.status})`);
    const redirectLocation = approveRes.headers.get("location") || "";
    assert(redirectLocation.startsWith(validRedirectUri), "Redirect location starts with registered redirect URI");

    const parsedRedirect = new URL(redirectLocation);
    const authCode = parsedRedirect.searchParams.get("code") || "";
    const returnedState = parsedRedirect.searchParams.get("state") || "";
    assert(authCode.length > 0, "Redirect contains authorization code");
    assert(returnedState === oauthState, "State parameter matches exactly (CSRF protection)");

    // 3.3 Token Exchange with invalid PKCE code_verifier should fail
    const badPkceRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri: validRedirectUri,
        client_id: clientId,
        code_verifier: "wrong_verifier_which_does_not_match_s256_hash_123456789"
      }).toString()
    });
    assert(badPkceRes.status === 400, `POST /oauth/token rejects invalid PKCE verifier (${badPkceRes.status})`);
    const badPkceErr = await badPkceRes.json();
    assert(badPkceErr.error === "invalid_grant", `Error is invalid_grant: ${badPkceErr.error_description}`);

    // Since the code was consumed/failed, let's generate a fresh code for successful exchange
    const codeVerifierValid = base64url(crypto.randomBytes(32));
    const codeChallengeValid = base64url(crypto.createHash("sha256").update(codeVerifierValid).digest());

    const freshAuthParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: validRedirectUri,
      scope: "mcp:read mcp:write",
      code_challenge: codeChallengeValid,
      code_challenge_method: "S256",
      state: "state_valid_999",
      resource: `${baseUrl}/mcp`
    });

    const freshApproveRes = await fetch(`${baseUrl}/oauth/authorize?${freshAuthParams.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "approve" }).toString(),
      redirect: "manual"
    });
    const freshLocation = new URL(freshApproveRes.headers.get("location") || "");
    const validAuthCode = freshLocation.searchParams.get("code") || "";

    // 3.4 Token Exchange with valid PKCE code_verifier
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: validAuthCode,
        redirect_uri: validRedirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifierValid,
        resource: `${baseUrl}/mcp`
      }).toString()
    });
    assert(tokenRes.status === 200, `POST /oauth/token returns 200 OK (${tokenRes.status})`);
    const tokenData = await tokenRes.json();
    assert(typeof tokenData.access_token === "string" && tokenData.access_token.split(".").length === 3, "Issued access_token is a signed 3-part JWT");
    assert(tokenData.token_type === "Bearer", "token_type is 'Bearer'");
    assert(typeof tokenData.expires_in === "number" && tokenData.expires_in > 0, `Token expires_in is ${tokenData.expires_in}s`);
    assert(typeof tokenData.refresh_token === "string", "Token response includes refresh_token");
    assert(tokenData.scope === "mcp:read mcp:write", `Token scope granted: ${tokenData.scope}`);

    const oauthAccessToken = tokenData.access_token;
    const oauthRefreshToken = tokenData.refresh_token;

    // -------------------------------------------------------------
    // SECTION 4: REFRESH TOKEN FLOW & REVOCATION (RFC 7009)
    // -------------------------------------------------------------
    console.log("\n--- 4. Refresh Token Flow & Revocation ---");

    // 4.1 Refresh token exchange
    const refreshRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: oauthRefreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });
    assert(refreshRes.status === 200, `POST /oauth/token (grant_type=refresh_token) returns 200 OK (${refreshRes.status})`);
    const refreshData = await refreshRes.json();
    assert(typeof refreshData.access_token === "string", "Refreshed access_token issued");
    assert(typeof refreshData.refresh_token === "string" && refreshData.refresh_token !== oauthRefreshToken, "Refresh token was rotated securely");

    const refreshedAccessToken = refreshData.access_token;
    const newRefreshToken = refreshData.refresh_token;

    // 4.2 Old refresh token should no longer work
    const oldRefreshRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: oauthRefreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });
    assert(oldRefreshRes.status === 400, `Previous rotated refresh token rejected with 400 (${oldRefreshRes.status})`);

    // 4.3 Revocation of new refresh token
    const revokeRes = await fetch(`${baseUrl}/oauth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: newRefreshToken,
        client_id: clientId
      }).toString()
    });
    assert(revokeRes.status === 200, `POST /oauth/revoke returns 200 OK (${revokeRes.status})`);

    // -------------------------------------------------------------
    // SECTION 5: WWW-AUTHENTICATE CHALLENGES & TOKEN VALIDATION
    // -------------------------------------------------------------
    console.log("\n--- 5. Security Challenges & WWW-Authenticate Verification ---");

    // 5.1 Missing credentials challenge
    const unauthMcpRes = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(unauthMcpRes.status === 401, `Unauthenticated POST /mcp returns 401 (${unauthMcpRes.status})`);
    const wwwAuth = unauthMcpRes.headers.get("www-authenticate") || "";
    assert(wwwAuth.includes('Bearer realm="mcp"'), `WWW-Authenticate contains Bearer realm="mcp": ${wwwAuth}`);
    assert(wwwAuth.includes('resource_metadata="'), "WWW-Authenticate contains RFC 9728 resource_metadata URI");

    // 5.2 Invalid token challenge
    const invalidTokenRes = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer not-a-valid-token-string-xyz"
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(invalidTokenRes.status === 401, `Invalid token POST /mcp returns 401 (${invalidTokenRes.status})`);
    const badTokenAuth = invalidTokenRes.headers.get("www-authenticate") || "";
    assert(badTokenAuth.includes('error="invalid_token"'), "WWW-Authenticate contains error=\"invalid_token\"");

    // 5.3 Expired token verification
    // Generate an intentionally expired token directly via oauthService
    const expiredPayload = {
      iss: baseUrl,
      sub: "user_test",
      aud: `${baseUrl}/mcp`,
      client_id: clientId,
      scope: "mcp:read mcp:write",
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
    };
    const expiredToken = oauthService.createSignedJwt(expiredPayload);

    const expiredRes = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${expiredToken}`
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(expiredRes.status === 401, `Expired token POST /mcp returns 401 (${expiredRes.status})`);
    const expiredAuth = expiredRes.headers.get("www-authenticate") || "";
    assert(expiredAuth.includes("Token expired") || expiredAuth.includes("invalid_token"), `WWW-Authenticate indicates token expiration: ${expiredAuth}`);

    // 5.4 Token with invalid audience
    const badAudPayload = {
      iss: baseUrl,
      sub: "user_test",
      aud: "https://wrong-audience.example.com",
      client_id: clientId,
      scope: "mcp:read mcp:write",
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const badAudToken = oauthService.createSignedJwt(badAudPayload);
    const badAudRes = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${badAudToken}`
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialize", id: 1 })
    });
    assert(badAudRes.status === 401, `Invalid audience token POST /mcp returns 401 (${badAudRes.status})`);

    // -------------------------------------------------------------
    // SECTION 6: MCP CLIENT CONNECTIVITY USING OAUTH 2.1 TOKEN
    // -------------------------------------------------------------
    console.log("\n--- 6. Live MCP Client Verification with OAuth 2.1 Token ---");

    const mcpClient = new Client({ name: "chatgpt-custom-mcp-connector", version: "1.0.0" });
    const mcpTransport = new StreamableHTTPClientTransport(
      new URL(`${baseUrl}/mcp`),
      {
        requestInit: {
          headers: {
            "Authorization": `Bearer ${refreshedAccessToken}`
          }
        }
      }
    );

    await mcpClient.connect(mcpTransport);
    assert(true, "MCP Client connected successfully using OAuth 2.1 Bearer access token");

    // 6.1 Discover tools
    const toolsResult = await mcpClient.listTools();
    const availableToolNames = toolsResult.tools.map((t) => t.name);
    console.log("Discovered MCP tools:", availableToolNames.join(", "));
    assert(availableToolNames.length === 6, `All 6 required MCP tools discovered (${availableToolNames.length})`);

    const requiredTools = [
      "search_company_info",
      "get_product_details",
      "summarize_service",
      "search_knowledge",
      "get_project_status",
      "create_report"
    ];

    for (const reqTool of requiredTools) {
      assert(availableToolNames.includes(reqTool), `Tool '${reqTool}' is registered and discoverable`);
    }

    // 6.2 Verify schemas of all six tools
    for (const tool of toolsResult.tools) {
      assert(typeof tool.name === "string" && tool.name.length > 0, `Tool ${tool.name} has valid name`);
      assert(typeof tool.description === "string" && tool.description.length > 0, `Tool ${tool.name} has valid description`);
      assert(typeof tool.inputSchema === "object" && tool.inputSchema !== null, `Tool ${tool.name} has valid JSON input schema`);
    }

    // 6.3 Execute get_product_details for 'core-banking-solution'
    console.log("\nExecuting get_product_details for 'core-banking-solution'...");
    const cbsCallResult: any = await mcpClient.callTool({
      name: "get_product_details",
      arguments: { product_name_or_slug: "core-banking-solution" }
    });
    assert(Array.isArray(cbsCallResult.content), "Tool call returned content array");
    const cbsData = JSON.parse(cbsCallResult.content[0].text);

    assert(cbsData.found === true, "get_product_details successfully found Core Banking Solution");
    assert(typeof cbsData.title === "string" && cbsData.title.includes("Core Banking"), `Product title verified: ${cbsData.title}`);
    assert(typeof cbsData.subtitle === "string" && cbsData.subtitle.length > 0, `Product subtitle verified: ${cbsData.subtitle}`);
    assert(typeof cbsData.summary === "string" && cbsData.summary.length > 0, "Product summary is non-empty");
    assert(Array.isArray(cbsData.features) && cbsData.features.length >= 3, `Product has ${cbsData.features.length} verified features`);
    assert(Array.isArray(cbsData.metrics) && cbsData.metrics.length >= 4, `Product has ${cbsData.metrics.length} real metrics`);
    assert(cbsData.source_url === "https://vgipl-website.vercel.app/products/core-banking-solution", `Source URL matches official product documentation: ${cbsData.source_url}`);

    // Verify key metrics without hardcoding assumptions
    const metricLabels = cbsData.metrics.map((m: any) => `${m.label}: ${m.value}`).join(", ");
    console.log("Verified CBS metrics:", metricLabels);

    // 6.4 Execute search_company_info
    const compCallResult: any = await mcpClient.callTool({
      name: "search_company_info",
      arguments: { query: "Virtual Galaxy Infotech" }
    });
    const compData = JSON.parse(compCallResult.content[0].text);
    assert(compData.found === true && compData.results.length > 0, "search_company_info executed and found results");

    // 6.5 Execute summarize_service
    const servCallResult: any = await mcpClient.callTool({
      name: "summarize_service",
      arguments: { service_name_or_slug: "vgst" }
    });
    const servData = JSON.parse(servCallResult.content[0].text);
    assert(servData.found === true, "summarize_service executed for VGST");

    // 6.6 Execute search_knowledge
    const knowCallResult: any = await mcpClient.callTool({
      name: "search_knowledge",
      arguments: { query: "cloud banking" }
    });
    const knowData = JSON.parse(knowCallResult.content[0].text);
    assert(knowData.count > 0, "search_knowledge executed and returned items");

    // 6.7 Execute get_project_status
    const projCallResult: any = await mcpClient.callTool({
      name: "get_project_status",
      arguments: { project_name: "Core Banking Migration Project" }
    });
    const projData = JSON.parse(projCallResult.content[0].text);
    assert(typeof projData.status === "string" && projData.status.length > 0, "get_project_status executed successfully");

    // 6.8 Execute create_report
    const reportCallResult: any = await mcpClient.callTool({
      name: "create_report",
      arguments: {
        title: "Core Banking Solution Architecture",
        notes: [
          "200+ banks served globally with CBS E-Banker",
          "30B+ transactions processed with 99.9% uptime",
          "10ms average transaction response time"
        ]
      }
    });
    const reportText = reportCallResult.content[0].text;
    assert(typeof reportText === "string" && reportText.includes("# Core Banking Solution Architecture"), "create_report executed and generated structured report");

    await mcpClient.close();
    assert(true, "MCP Client closed cleanly");

    // -------------------------------------------------------------
    // SECTION 7: CODEX BACKWARDS COMPATIBILITY (STATIC BEARER KEY)
    // -------------------------------------------------------------
    console.log("\n--- 7. Codex Client Regression Testing (Static Bearer API Key) ---");

    const codexClient = new Client({ name: "codex-desktop-client", version: "1.0.0" });
    const codexTransport = new StreamableHTTPClientTransport(
      new URL(`${baseUrl}/mcp`),
      {
        requestInit: {
          headers: {
            "Authorization": `Bearer ${TEST_API_KEY}`
          }
        }
      }
    );

    await codexClient.connect(codexTransport);
    assert(true, "Codex client connected successfully using static Bearer API key");

    const codexTools = await codexClient.listTools();
    assert(codexTools.tools.length === 6, `Codex client discovered all ${codexTools.tools.length} tools`);

    const codexCBS: any = await codexClient.callTool({
      name: "get_product_details",
      arguments: { product_name_or_slug: "core-banking-solution" }
    });
    const codexCBSData = JSON.parse(codexCBS.content[0].text);
    assert(codexCBSData.found === true, "Codex client executed get_product_details with static API key");

    await codexClient.close();
    assert(true, "Codex client closed cleanly");

    // -------------------------------------------------------------
    // SECTION 8: ZERO SECRET LEAKAGE AUDIT
    // -------------------------------------------------------------
    console.log("\n--- 8. Security & Secret Leakage Audit ---");

    const openApiRes = await fetch(`${baseUrl}/api/openapi.json`);
    const openApiText = await openApiRes.text();
    assert(!openApiText.includes(TEST_API_KEY), "OpenAPI JSON does not contain production or test API key");
    assert(openApiText.includes("OAuth2") && openApiText.includes("BearerAuth"), "OpenAPI specifies both BearerAuth and OAuth2 security schemes");

    const healthRes = await fetch(`${baseUrl}/health`);
    const healthText = await healthRes.text();
    assert(!healthText.includes(TEST_API_KEY), "Health endpoint does not expose API key");
    assert(healthText.includes('"oauthEnabled":true'), "Health endpoint reports oauthEnabled: true");

  } finally {
    server.close();
    console.log("\nTest server stopped.");
  }

  console.log("\n===============================================================");
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runOAuthAndChatGPTTests().catch((err) => {
  console.error("Test failed with unhandled exception:", err);
  process.exit(1);
});
