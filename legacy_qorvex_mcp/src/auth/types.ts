export interface OAuthClient {
  client_id: string;
  client_secret?: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  created_at: number;
}

export interface AuthorizationCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256";
  scope: string;
  resource?: string;
  user_id: string;
  expires_at: number;
  used: boolean;
}

export interface AccessTokenRecord {
  token: string;
  client_id: string;
  user_id: string;
  scope: string;
  resource: string;
  issuer: string;
  expires_at: number;
  revoked: boolean;
}

export interface RefreshTokenRecord {
  token: string;
  client_id: string;
  user_id: string;
  scope: string;
  resource: string;
  issuer: string;
  expires_at: number;
  revoked: boolean;
}

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
  resource_documentation?: string;
}

export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  revocation_endpoint?: string;
  jwks_uri?: string;
  response_types_supported: string[];
  response_modes_supported: string[];
  grant_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  code_challenge_methods_supported: string[];
  scopes_supported: string[];
  service_documentation?: string;
}
