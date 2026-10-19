import express, { Request, Response, Router } from "express";
import { oauthService } from "./oauth.js";

export const oauthRouter = Router();

// --- RFC 9728: Protected Resource Metadata ---
oauthRouter.get("/.well-known/oauth-protected-resource", (req: Request, res: Response) => {
  const baseUrl = oauthService.getBaseUrl(req);
  res.setHeader("Content-Type", "application/json");
  return res.json(oauthService.getProtectedResourceMetadata(baseUrl));
});

oauthRouter.get("/.well-known/oauth-protected-resource/mcp", (req: Request, res: Response) => {
  const baseUrl = oauthService.getBaseUrl(req);
  res.setHeader("Content-Type", "application/json");
  return res.json(oauthService.getProtectedResourceMetadata(baseUrl));
});

// --- RFC 8414: OAuth 2.0 Authorization Server Metadata ---
oauthRouter.get("/.well-known/oauth-authorization-server", (req: Request, res: Response) => {
  const baseUrl = oauthService.getBaseUrl(req);
  res.setHeader("Content-Type", "application/json");
  return res.json(oauthService.getAuthorizationServerMetadata(baseUrl));
});

oauthRouter.get("/.well-known/openid-configuration", (req: Request, res: Response) => {
  const baseUrl = oauthService.getBaseUrl(req);
  res.setHeader("Content-Type", "application/json");
  return res.json(oauthService.getAuthorizationServerMetadata(baseUrl));
});

// --- RFC 7517: JSON Web Key Set (JWKS) ---
oauthRouter.get("/.well-known/jwks.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  return res.json({
    keys: [
      {
        kty: "oct",
        alg: "HS256",
        use: "sig",
        kid: "qorvex-oauth-key-1"
      }
    ]
  });
});

// --- RFC 7591: Dynamic Client Registration ---
oauthRouter.post("/oauth/register", (req: Request, res: Response) => {
  try {
    const { registrationResponse } = oauthService.registerClient(req.body);
    return res.status(201).json(registrationResponse);
  } catch (err: any) {
    return res.status(400).json({
      error: "invalid_client_metadata",
      error_description: err.message || "Failed to register client."
    });
  }
});

// --- OAuth 2.1: Authorization Endpoint ---
oauthRouter.get("/oauth/authorize", (req: Request, res: Response) => {
  const clientId = typeof req.query.client_id === "string" ? req.query.client_id : "";
  const redirectUri = typeof req.query.redirect_uri === "string" ? req.query.redirect_uri : "";
  const responseType = typeof req.query.response_type === "string" ? req.query.response_type : "";
  const codeChallenge = typeof req.query.code_challenge === "string" ? req.query.code_challenge : "";
  const codeChallengeMethod = typeof req.query.code_challenge_method === "string" ? req.query.code_challenge_method : "";
  const scope = typeof req.query.scope === "string" ? req.query.scope : "mcp:tools";
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  const resource = typeof req.query.resource === "string" ? req.query.resource : undefined;

  // Basic validation
  if (!clientId) {
    return res.status(400).send("invalid_request: Missing 'client_id' parameter.");
  }

  const client = oauthService.getClient(clientId);
  if (!client && clientId !== "chatgpt-mcp-connector") {
    return res.status(400).send(`invalid_client: Unregistered client '${clientId}'.`);
  }

  if (!redirectUri || !oauthService.validateRedirectUri(client, redirectUri)) {
    return res.status(400).send("invalid_request: Missing or unapproved 'redirect_uri'.");
  }

  // OAuth 2.1 enforces response_type=code
  if (responseType !== "code") {
    const sep = redirectUri.includes("?") ? "&" : "?";
    return res.redirect(`${redirectUri}${sep}error=unsupported_response_type&error_description=Only+code+response_type+is+supported${state ? `&state=${encodeURIComponent(state)}` : ""}`);
  }

  // OAuth 2.1 strictly requires PKCE S256
  if (!codeChallenge) {
    const sep = redirectUri.includes("?") ? "&" : "?";
    return res.redirect(`${redirectUri}${sep}error=invalid_request&error_description=PKCE+code_challenge+is+required+in+OAuth+2.1${state ? `&state=${encodeURIComponent(state)}` : ""}`);
  }

  if (codeChallengeMethod !== "S256") {
    const sep = redirectUri.includes("?") ? "&" : "?";
    return res.redirect(`${redirectUri}${sep}error=invalid_request&error_description=Only+S256+code_challenge_method+is+supported${state ? `&state=${encodeURIComponent(state)}` : ""}`);
  }

  // Render HTML Consent Screen
  const clientName = client?.client_name || "ChatGPT Custom Connector";
  const html = oauthService.renderConsentPage({
    client_name: clientName,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    resource
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

oauthRouter.post("/oauth/authorize", (req: Request, res: Response) => {
  const client_id = req.body?.client_id || (typeof req.query.client_id === "string" ? req.query.client_id : "");
  const redirect_uri = req.body?.redirect_uri || (typeof req.query.redirect_uri === "string" ? req.query.redirect_uri : "");
  const scope = req.body?.scope || (typeof req.query.scope === "string" ? req.query.scope : "mcp:tools");
  const state = req.body?.state || (typeof req.query.state === "string" ? req.query.state : undefined);
  const code_challenge = req.body?.code_challenge || (typeof req.query.code_challenge === "string" ? req.query.code_challenge : "");
  const code_challenge_method = req.body?.code_challenge_method || (typeof req.query.code_challenge_method === "string" ? req.query.code_challenge_method : "");
  const resource = req.body?.resource || (typeof req.query.resource === "string" ? req.query.resource : undefined);

  if (!client_id || !redirectUriValid(client_id, redirect_uri)) {
    return res.status(400).send("invalid_request: Malformed authorization submission.");
  }

  if (!code_challenge || code_challenge_method !== "S256") {
    return res.status(400).send("invalid_request: PKCE S256 code challenge required.");
  }

  // Generate authorization code
  const code = oauthService.createAuthorizationCode({
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method: "S256",
    scope,
    resource
  });

  const sep = redirect_uri.includes("?") ? "&" : "?";
  let redirectUrl = `${redirect_uri}${sep}code=${encodeURIComponent(code)}`;
  if (state) {
    redirectUrl += `&state=${encodeURIComponent(state)}`;
  }

  return res.redirect(redirectUrl);
});

function redirectUriValid(clientId: string, redirectUri: string): boolean {
  if (!redirectUri) return false;
  const client = oauthService.getClient(clientId);
  return oauthService.validateRedirectUri(client, redirectUri);
}

// --- OAuth 2.1: Token Endpoint ---
oauthRouter.post("/oauth/token", (req: Request, res: Response) => {
  const baseUrl = oauthService.getBaseUrl(req);
  const grantType = req.body?.grant_type;

  // Extract client credentials from Basic Auth header or body
  let clientId = req.body?.client_id;
  let clientSecret = req.body?.client_secret;

  const authHeader = req.header("authorization")?.trim() ?? "";
  if (authHeader.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf8");
      const [bUser, bPass] = decoded.split(":");
      clientId = bUser;
      clientSecret = bPass;
    } catch {
      // ignore header decode errors
    }
  }

  try {
    if (grantType === "authorization_code") {
      const code = req.body?.code;
      const redirectUri = req.body?.redirect_uri;
      const codeVerifier = req.body?.code_verifier;
      const resource = req.body?.resource;

      if (!code || !redirectUri || !clientId || !codeVerifier) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters: code, redirect_uri, client_id, and code_verifier are required."
        });
      }

      const tokenResponse = oauthService.exchangeCodeForTokens({
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
        client_secret: clientSecret,
        resource,
        baseUrl
      });

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");
      return res.json(tokenResponse);

    } else if (grantType === "refresh_token") {
      const refreshToken = req.body?.refresh_token;
      const scope = req.body?.scope;

      if (!refreshToken || !clientId) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing required parameters: refresh_token and client_id are required."
        });
      }

      const tokenResponse = oauthService.refreshToken({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        scope,
        baseUrl
      });

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");
      return res.json(tokenResponse);

    } else {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: `Grant type '${grantType}' is not supported. Supported grant types: authorization_code, refresh_token.`
      });
    }
  } catch (err: any) {
    const msg = err.message || "Token exchange error";
    const [errorCode, errorDesc] = msg.includes(":") ? msg.split(":").map((s: string) => s.trim()) : ["invalid_grant", msg];
    return res.status(400).json({
      error: errorCode,
      error_description: errorDesc
    });
  }
});

// --- RFC 7009: Token Revocation ---
oauthRouter.post("/oauth/revoke", (req: Request, res: Response) => {
  const token = req.body?.token;
  if (!token) {
    return res.status(400).json({ error: "invalid_request", error_description: "Missing token parameter." });
  }

  oauthService.revokeToken(token);
  return res.status(200).json({ revoked: true });
});
