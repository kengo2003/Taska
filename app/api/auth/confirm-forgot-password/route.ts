import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
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
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const secretHash = calcSecretHash(email);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: secretHash,
    });

    await client.send(command);

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error: unknown) {
    console.error("Confirm Reset Error:", error);
    let msg = "Failed to reset password";

    if (error instanceof Error) {
      msg = error.message;
      if (error.name === "CodeMismatchException") {
        msg = "認証コードが間違っています";
      } else if (error.name === "ExpiredCodeException") {
        msg = "認証コードの有効期限が切れています";
      }
    }

    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
