import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import {
  OAuthClient,
  AuthorizationCode,
  AccessTokenRecord,
  RefreshTokenRecord,
  ProtectedResourceMetadata,
  AuthorizationServerMetadata
} from "./types.js";

/**
 * Enterprise OAuth 2.1 Authorization Service for QORVEX VGIL MCP Server.
 * Implements RFC 8414, RFC 9728, RFC 7591, RFC 7636 (PKCE S256), and RFC 7009 (Revocation).
 */
export class OAuthService {
  private clients = new Map<string, OAuthClient>();
  private authCodes = new Map<string, AuthorizationCode>();
  private accessTokens = new Map<string, AccessTokenRecord>();
  private refreshTokens = new Map<string, RefreshTokenRecord>();
  private jwtSecret: string;
  private defaultIssuer?: string;

  constructor() {
    this.jwtSecret = process.env.OAUTH_JWT_SECRET?.trim() || crypto.randomBytes(32).toString("hex");
    this.defaultIssuer = process.env.OAUTH_ISSUER?.trim();
    this.initDefaultClients();
  }

  private initDefaultClients(): void {
    // 1. Configured static client from environment variables (if provided)
    const envClientId = process.env.OAUTH_CLIENT_ID?.trim();
    const envClientSecret = process.env.OAUTH_CLIENT_SECRET?.trim();
    const allowedUris = (process.env.OAUTH_ALLOWED_REDIRECT_URIS ?? "")
      .split(",")
      .map(u => u.trim())
      .filter(Boolean);

    if (envClientId) {
      this.clients.set(envClientId, {
        client_id: envClientId,
        client_secret: envClientSecret || undefined,
        client_name: "Preconfigured Client",
        redirect_uris: allowedUris.length > 0 ? allowedUris : [
          "https://chatgpt.com/connector_platform_oauth_redirect",
          "https://chatgpt.com/aip/plugin-oauth/callback",
          "http://localhost:3000/oauth/callback"
        ],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: envClientSecret ? "client_secret_post" : "none",
        created_at: Date.now()
      });
    }

    // 2. Default client definition for ChatGPT Custom MCP Connectors
    const chatgptClientId = "chatgpt-mcp-connector";
    if (!this.clients.has(chatgptClientId)) {
      this.clients.set(chatgptClientId, {
        client_id: chatgptClientId,
        client_name: "ChatGPT Custom MCP Connector",
        redirect_uris: [
          "https://chatgpt.com/connector_platform_oauth_redirect",
          "https://chatgpt.com/aip/plugin-oauth/callback"
        ],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        created_at: Date.now()
      });
    }
  }

  public getBaseUrl(req?: Request): string {
    if (this.defaultIssuer) return this.defaultIssuer;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (req) {
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      if (host) return `${proto}://${host}`;
    }
    return "https://qorvex-vgil-backend-production.up.railway.app";
  }

  public getResourceUrl(req?: Request): string {
    return `${this.getBaseUrl(req)}/mcp`;
  }

  // --- RFC 9728 Protected Resource Metadata ---
  public getProtectedResourceMetadata(baseUrl: string): ProtectedResourceMetadata {
    return {
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      scopes_supported: ["mcp:read", "mcp:write", "mcp:tools", "offline_access"],
      bearer_methods_supported: ["header"],
      resource_documentation: "https://vgipl-website.vercel.app"
    };
  }

  // --- RFC 8414 Authorization Server Metadata ---
  public getAuthorizationServerMetadata(baseUrl: string): AuthorizationServerMetadata {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      registration_endpoint: `${baseUrl}/oauth/register`,
      revocation_endpoint: `${baseUrl}/oauth/revoke`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["mcp:read", "mcp:write", "mcp:tools", "offline_access"],
      service_documentation: "https://vgipl-website.vercel.app"
    };
  }

  // --- RFC 7591 Dynamic Client Registration ---
  public registerClient(body: any): { client: OAuthClient; registrationResponse: any } {
    const clientName = typeof body.client_name === "string" ? body.client_name.trim() : "ChatGPT Custom MCP Client";
    const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u: any) => typeof u === "string") : [];

    if (redirectUris.length === 0) {
      throw new Error("invalid_client_metadata: redirect_uris must contain at least one valid URI.");
    }

    for (const uri of redirectUris) {
      try {
        const parsed = new URL(uri);
        if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
          throw new Error("invalid_redirect_uri: Redirect URIs must use HTTPS unless localhost.");
        }
      } catch (e: any) {
        throw new Error(`invalid_redirect_uri: Malformed URI '${uri}' (${e.message})`);
      }
    }

    const clientId = `client_${crypto.randomBytes(16).toString("hex")}`;
    const tokenEndpointAuthMethod = body.token_endpoint_auth_method === "none"
      ? "none"
      : (body.token_endpoint_auth_method || "client_secret_post");

    let clientSecret: string | undefined = undefined;
    if (tokenEndpointAuthMethod !== "none") {
      clientSecret = `sec_${crypto.randomBytes(24).toString("hex")}`;
    }

    const client: OAuthClient = {
      client_id: clientId,
      client_secret: clientSecret,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: tokenEndpointAuthMethod,
      created_at: Date.now()
    };

    this.clients.set(clientId, client);

    const registrationResponse: any = {
      client_id: client.client_id,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      token_endpoint_auth_method: client.token_endpoint_auth_method,
      client_id_issued_at: Math.floor(client.created_at / 1000)
    };

    if (clientSecret) {
      registrationResponse.client_secret = clientSecret;
      registrationResponse.client_secret_expires_at = 0; // Does not expire
    }

    return { client, registrationResponse };
  }

  public getClient(clientId: string): OAuthClient | undefined {
    return this.clients.get(clientId);
  }

  public validateRedirectUri(client: OAuthClient | undefined, redirectUri: string): boolean {
    if (!redirectUri) return false;
    try {
      const parsed = new URL(redirectUri);
      // Explicit registration match
      if (client?.redirect_uris.includes(redirectUri)) return true;

      // Allow official ChatGPT connector callbacks
      if (parsed.hostname === "chatgpt.com") {
        if (parsed.pathname === "/connector_platform_oauth_redirect" ||
            parsed.pathname.startsWith("/connector/oauth/") ||
            parsed.pathname === "/aip/plugin-oauth/callback") {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  // --- PKCE S256 Verification (RFC 7636) ---
  public verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
    if (!codeVerifier || !codeChallenge) return false;
    try {
      const calculated = crypto
        .createHash("sha256")
        .update(codeVerifier, "ascii")
        .digest("base64url");

      if (calculated.length !== codeChallenge.length) return false;
      return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(codeChallenge));
    } catch {
      return false;
    }
  }

  // --- Authorization Code Flow ---
  public createAuthorizationCode(params: {
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: "S256";
    scope?: string;
    resource?: string;
    user_id?: string;
  }): string {
    const code = `code_${crypto.randomBytes(24).toString("base64url")}`;
    const record: AuthorizationCode = {
      code,
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method,
      scope: params.scope || "mcp:tools",
      resource: params.resource,
      user_id: params.user_id || "chatgpt-user",
      expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
      used: false
    };

    this.authCodes.set(code, record);
    return code;
  }

  // --- Token Minting & Exchange ---
  private createSignedJwt(payload: Record<string, any>): string {
    const header = { alg: "HS256", typ: "JWT" };
    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.jwtSecret)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  public verifyJwt(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return { valid: false, error: "Malformed JWT structure" };

      const [b64Header, b64Payload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", this.jwtSecret)
        .update(`${b64Header}.${b64Payload}`)
        .digest("base64url");

      if (expectedSig.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))) {
        return { valid: false, error: "Invalid token signature" };
      }

      const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
      const nowSec = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < nowSec) {
        return { valid: false, error: "Token expired" };
      }

      return { valid: true, payload };
    } catch (e: any) {
      return { valid: false, error: e.message || "JWT verification failed" };
    }
  }

  public exchangeCodeForTokens(params: {
    code: string;
    redirect_uri: string;
    client_id: string;
    code_verifier: string;
    client_secret?: string;
    resource?: string;
    baseUrl: string;
  }): {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token?: string;
    scope: string;
  } {
    const authCode = this.authCodes.get(params.code);
    if (!authCode) {
      throw new Error("invalid_grant: Authorization code not found or expired.");
    }

    if (authCode.used) {
      this.authCodes.delete(params.code);
      throw new Error("invalid_grant: Authorization code has already been redeemed.");
    }

    if (Date.now() > authCode.expires_at) {
      this.authCodes.delete(params.code);
      throw new Error("invalid_grant: Authorization code expired.");
    }

    if (authCode.client_id !== params.client_id) {
      throw new Error("invalid_grant: client_id mismatch.");
    }

    if (authCode.redirect_uri !== params.redirect_uri) {
      throw new Error("invalid_grant: redirect_uri mismatch.");
    }

    // Verify PKCE S256
    const pkceOk = this.verifyPkceS256(params.code_verifier, authCode.code_challenge);
    if (!pkceOk) {
      throw new Error("invalid_grant: PKCE code_verifier challenge verification failed.");
    }

    // Verify Client Secret if confidential client
    const client = this.clients.get(params.client_id);
    if (client && client.client_secret) {
      if (!params.client_secret || params.client_secret !== client.client_secret) {
        throw new Error("invalid_client: Client secret authentication failed.");
      }
    }

    // Mark code as used immediately
    authCode.used = true;
    this.authCodes.delete(params.code);

    const nowSec = Math.floor(Date.now() / 1000);
    const ttlSeconds = 3600; // 1 hour
    const resource = params.resource || authCode.resource || `${params.baseUrl}/mcp`;

    const tokenPayload = {
      iss: params.baseUrl,
      sub: authCode.user_id,
      aud: resource,
      client_id: params.client_id,
      scope: authCode.scope,
      iat: nowSec,
      exp: nowSec + ttlSeconds,
      jti: crypto.randomBytes(16).toString("hex")
    };

    const accessToken = this.createSignedJwt(tokenPayload);

    // Save access token record
    this.accessTokens.set(accessToken, {
      token: accessToken,
      client_id: params.client_id,
      user_id: authCode.user_id,
      scope: authCode.scope,
      resource,
      issuer: params.baseUrl,
      expires_at: (nowSec + ttlSeconds) * 1000,
      revoked: false
    });

    // Generate refresh token
    const refreshToken = `rt_${crypto.randomBytes(32).toString("base64url")}`;
    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      client_id: params.client_id,
      user_id: authCode.user_id,
      scope: authCode.scope,
      resource,
      issuer: params.baseUrl,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      revoked: false
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ttlSeconds,
      refresh_token: refreshToken,
      scope: authCode.scope
    };
  }

  public refreshToken(params: {
    refresh_token: string;
    client_id: string;
    client_secret?: string;
    scope?: string;
    baseUrl: string;
  }): {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
  } {
    const record = this.refreshTokens.get(params.refresh_token);
    if (!record || record.revoked || Date.now() > record.expires_at) {
      throw new Error("invalid_grant: Refresh token is invalid or expired.");
    }

    if (record.client_id !== params.client_id) {
      throw new Error("invalid_grant: Refresh token was not issued to this client.");
    }

    // Verify confidential client secret if present
    const client = this.clients.get(params.client_id);
    if (client && client.client_secret) {
      if (!params.client_secret || params.client_secret !== client.client_secret) {
        throw new Error("invalid_client: Client secret authentication failed.");
      }
    }

    // Revoke old refresh token (rotation)
    record.revoked = true;
    this.refreshTokens.delete(params.refresh_token);

    const nowSec = Math.floor(Date.now() / 1000);
    const ttlSeconds = 3600;
    const scope = params.scope || record.scope;

    const tokenPayload = {
      iss: params.baseUrl,
      sub: record.user_id,
      aud: record.resource,
      client_id: params.client_id,
      scope,
      iat: nowSec,
      exp: nowSec + ttlSeconds,
      jti: crypto.randomBytes(16).toString("hex")
    };

    const newAccessToken = this.createSignedJwt(tokenPayload);
    this.accessTokens.set(newAccessToken, {
      token: newAccessToken,
      client_id: params.client_id,
      user_id: record.user_id,
      scope,
      resource: record.resource,
      issuer: params.baseUrl,
      expires_at: (nowSec + ttlSeconds) * 1000,
      revoked: false
    });

    const newRefreshToken = `rt_${crypto.randomBytes(32).toString("base64url")}`;
    this.refreshTokens.set(newRefreshToken, {
      token: newRefreshToken,
      client_id: params.client_id,
      user_id: record.user_id,
      scope,
      resource: record.resource,
      issuer: params.baseUrl,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      revoked: false
    });

    return {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: ttlSeconds,
      refresh_token: newRefreshToken,
      scope
    };
  }

  // --- Token Revocation (RFC 7009) ---
  public revokeToken(token: string): boolean {
    let found = false;
    if (this.accessTokens.has(token)) {
      const rec = this.accessTokens.get(token)!;
      rec.revoked = true;
      this.accessTokens.delete(token);
      found = true;
    }
    if (this.refreshTokens.has(token)) {
      const rec = this.refreshTokens.get(token)!;
      rec.revoked = true;
      this.refreshTokens.delete(token);
      found = true;
    }
    return found;
  }

  // --- Access Token Verification on Protected Resource ---
  public verifyAccessToken(token: string, expectedResource?: string): { valid: boolean; error?: string; payload?: any } {
    // 1. Check in-memory record if opaque or revoked
    const record = this.accessTokens.get(token);
    if (record) {
      if (record.revoked) return { valid: false, error: "Token has been revoked" };
      if (Date.now() > record.expires_at) return { valid: false, error: "Token has expired" };
    }

    // 2. Validate cryptographic signature and standard claims
    const jwtResult = this.verifyJwt(token);
    if (!jwtResult.valid) {
      return jwtResult;
    }

    const payload = jwtResult.payload;

    // 3. Verify Audience (RFC 8707 & OAuth 2.1)
    if (expectedResource && payload.aud) {
      const tokenAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      const matchesAud = tokenAud.some((aud: string) => {
        return aud === expectedResource ||
               expectedResource.startsWith(aud) ||
               aud.startsWith(expectedResource);
      });

      if (!matchesAud) {
        return { valid: false, error: `Invalid token audience: expected '${expectedResource}', got '${tokenAud.join(",")}'` };
      }
    }

    return { valid: true, payload };
  }

  // --- HTML Consent Screen for ChatGPT Web Connection ---
  public renderConsentPage(params: {
    client_name: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
    code_challenge: string;
    code_challenge_method: string;
    resource?: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize QORVEX — VGIL Knowledge Connector</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(17, 24, 39, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --accent: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 70%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      backdrop-filter: blur(16px);
      border-radius: 1.25rem;
      padding: 2.25rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(37, 99, 235, 0.15);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.25);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 1.5rem; font-weight: 800; line-height: 1.25; margin-bottom: 0.75rem; }
    p { color: var(--text-muted); font-size: 0.925rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .scopes {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1.75rem;
    }
    .scope-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .scope-item:last-child { margin-bottom: 0; }
    .check {
      color: #10b981;
      font-weight: 800;
      line-height: 1.2;
    }
    .buttons { display: flex; gap: 0.75rem; }
    button, .btn-cancel {
      flex: 1;
      padding: 0.85rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    button.btn-approve {
      background: var(--primary);
      color: #fff;
      border: none;
    }
    button.btn-approve:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-cancel {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .btn-cancel:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    .footnote {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Model Context Protocol &bull; OAuth 2.1</div>
    <h1>Connect to QORVEX &mdash; VGIL</h1>
    <p><strong>${escapeHtml(params.client_name)}</strong> is requesting secure authorization to access the QORVEX VGIL Enterprise Knowledge Connector.</p>
    
    <div class="scopes">
      <div class="scope-item">
        <span class="check">&#10003;</span>
        <div>
          <strong>CBS E-Banker & Enterprise IT Knowledge</strong>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Query banking modules, scale metrics, architecture, and MIHAN facility records.</div>
        </div>
      </div>
      <div class="scope-item">
        <span class="check">&#10003;</span>
        <div>
          <strong>Model Context Protocol Tools</strong>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Execute get_product_details, search_company_info, and verified retrieval tools.</div>
        </div>
      </div>
    </div>

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(params.client_id)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}">
      <input type="hidden" name="scope" value="${escapeHtml(params.scope)}">
      <input type="hidden" name="state" value="${escapeHtml(params.state || "")}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}">
      <input type="hidden" name="resource" value="${escapeHtml(params.resource || "")}">
      
      <div class="buttons">
        <a class="btn-cancel" href="${escapeHtml(params.redirect_uri)}?error=access_denied&state=${encodeURIComponent(params.state || "")}">Cancel</a>
        <button type="submit" class="btn-approve">Authorize &amp; Connect</button>
      </div>
    </form>
    <div class="footnote">Grounded information engine &bull; Independently developed &bull; Protected with PKCE S256</div>
  </div>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const oauthService = new OAuthService();

/**
 * Creates unified authentication middleware supporting:
 * 1. Static Bearer API Key (Codex Desktop, internal verifiers)
 * 2. OAuth 2.1 Access Tokens with PKCE (ChatGPT web custom connector)
 * 3. Proper RFC 9728 WWW-Authenticate challenges on 401
 */
export function createMcpAuthMiddleware(staticApiKey?: string) {
  return function requireMcpAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header("authorization")?.trim() ?? "";
    const baseUrl = oauthService.getBaseUrl(req);
    const prmUrl = `${baseUrl}/.well-known/oauth-protected-resource`;

    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      res.setHeader("WWW-Authenticate", `Bearer realm="mcp", resource_metadata="${prmUrl}"`);
      return res.status(401).json({
        error: "Unauthorized: Missing or malformed Bearer token",
        resource_metadata: prmUrl
      });
    }

    const token = authHeader.slice(7).trim();

    // 1. Static API Key Check (for backwards-compatibility with Codex & internal scripts)
    if (staticApiKey && token === staticApiKey) {
      return next();
    }

    // 2. OAuth Access Token Verification
    const expectedResource = `${baseUrl}/mcp`;
    const verification = oauthService.verifyAccessToken(token, expectedResource);

    if (verification.valid) {
      (req as any).oauthUser = verification.payload;
      return next();
    }

    // Unauthorized - Invalid or expired token
    const errorDesc = verification.error || "The access token is invalid or expired";
    res.setHeader(
      "WWW-Authenticate",
      `Bearer realm="mcp", error="invalid_token", error_description="${errorDesc}", resource_metadata="${prmUrl}"`
    );
    return res.status(401).json({
      error: `Unauthorized: ${errorDesc}`,
      resource_metadata: prmUrl
    });
  };
}
