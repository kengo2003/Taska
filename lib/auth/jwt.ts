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
};

export async function verifyIdToken(idToken: string): Promise<CognitoClaims> {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience: clientId,
  });

  if (payload.token_use !== "id") {
    throw new Error("Invalid token_use");
  }

  return payload as CognitoClaims;
}
