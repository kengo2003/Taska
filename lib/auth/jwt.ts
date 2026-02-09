import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

const region = process.env.AWS_REGION!;
const userPoolId = process.env.COGNITO_USER_POOL_ID!;
const clientId = process.env.COGNITO_CLIENT_ID!;

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export type CognitoClaims = JWTPayload & {
  email?: string;
  "cognito:groups"?: string[];
  token_use?: "id" | "access";
  client_id?: string;
  aud?: string;
};

export async function verifyAccessToken(token: string): Promise<CognitoClaims> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
  });

  if (payload.token_use !== "access") {
    throw new Error("Invalid token_use. Expected access token.");
  }

  if (payload.client_id !== clientId) {
    throw new Error("Invalid client_id");
  }

  return payload as CognitoClaims;
}

export async function verifyIdToken(token: string): Promise<CognitoClaims> {
  const { payload } = await jwtVerify(token, jwks, { issuer });

  if (payload.token_use !== "id") {
    throw new Error("Invalid token_use. Expected id token.");
  }
  if (payload.aud !== clientId) {
    throw new Error("Invalid aud");
  }
  return payload as CognitoClaims;
}
