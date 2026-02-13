import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

const cookieName = process.env.AUTH_COOKIE_NAME || "taska_session";

const accessCookieName = process.env.AUTH_ACCESS_COOKIE_NAME || "taska_access";

const isProduction = process.env.NODE_ENV === "production";
const secureCookie = isProduction;

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

function calcSecretHash(username: string) {
  const clientId = process.env.COGNITO_CLIENT_ID!;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET!;
  return crypto
    .createHmac("sha256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toString() ?? "";
  const password = body?.password?.toString() ?? "";
  const secretHash = calcSecretHash(email);

  if (!email.endsWith("@hcs.ac.jp")) {
    return NextResponse.json({ error: "invalid_domain" }, { status: 401 });
  }
  if (!password) {
    return NextResponse.json({ error: "missing_password" }, { status: 400 });
  }

  try {
    const res = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      }),
    );

    const idToken = res.AuthenticationResult?.IdToken;
    const accessToken = res.AuthenticationResult?.AccessToken;
    const expiresIn = res.AuthenticationResult?.ExpiresIn ?? 3600;

    if (!idToken) {
      return NextResponse.json({ error: "no_id_token" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(cookieName, idToken, {
      httpOnly: true,
      secure: secureCookie, // httpならfalse
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
    });

    if (accessToken) {
      response.cookies.set(accessCookieName, accessToken, {
        httpOnly: true,
        secure: secureCookie, // httpならfalse
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn,
      });
    }

    return response;
  } catch (e: unknown) {
    let errorName = "unknown";
    let errorMessage = "unknown";

    if (e instanceof Error) {
      errorName = e.name;
      errorMessage = e.message;
    }

    console.error("Cognito auth error:", {
      name: errorName,
      message: errorMessage,
    });

    return NextResponse.json(
      { error: "auth_failed", detail: errorName },
      { status: 401 },
    );
  }
}
