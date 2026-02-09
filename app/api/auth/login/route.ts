import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

const cookieName = process.env.AUTH_COOKIE_NAME || "taska_session";

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

  if (!email.endsWith("@hcs.ac.jp")) {
    return NextResponse.json({ error: "invalid_domain" }, { status: 401 });
  }
  if (!password) {
    return NextResponse.json({ error: "missing_password" }, { status: 400 });
  }

  try {
    const secretHash = calcSecretHash(email);

    const res = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          //SECRET_HASH: secretHash,
        },
      }),
    );

    const accessToken = res.AuthenticationResult?.AccessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    let groups: string[] = [];
    try {
      const payloadPart = accessToken.split(".")[1];
      const decodedPayload = JSON.parse(
        Buffer.from(payloadPart, "base64").toString("utf-8"),
      );
      groups = decodedPayload["cognito:groups"] || [];
    } catch (e) {
      console.error("Token decode error:", e);
    }

    const response = NextResponse.json({ ok: true, groups });

    // Cookie設定
    response.cookies.set(cookieName, accessToken, {
      httpOnly: true,
      secure: secureCookie, // httpならfalse
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (e: any) {
    console.error("Cognito auth error:", {
      name: e?.name,
      message: e?.message,
      $metadata: e?.$metadata,
    });

    return NextResponse.json(
      { error: "auth_failed", detail: e?.name ?? "unknown" },
      { status: 401 },
    );
  }
}
