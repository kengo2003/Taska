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
