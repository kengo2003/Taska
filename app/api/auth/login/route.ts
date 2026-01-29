import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

const cookieName = process.env.AUTH_COOKIE_NAME || "session";
const secureCookie = (process.env.AUTH_COOKIE_SECURE || "false") === "true";

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

  // UX/保険：ドメインチェック（最終防衛はCognito Trigger推奨）
  if (!email.endsWith("@hcs.ac.jp")) {
    return NextResponse.json({ error: "invalid_domain" }, { status: 401 });
  }
  if (!password) {
    return NextResponse.json({ error: "missing_password" }, { status: 400 });
  }

  const client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
  });

  try {
    const secretHash = calcSecretHash(email);

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
    if (!idToken) {
      return NextResponse.json({ error: "no_token" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(cookieName, idToken, {
      httpOnly: true,
      secure: secureCookie,
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
