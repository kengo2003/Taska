import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { csvText } = await req.json();
    const userPoolId = process.env.COGNITO_USER_POOL_ID!;

    const lines = csvText
      .split(/\r?\n/)
      .filter((line: string) => line.trim() !== "");
    const results = [];

    for (const line of lines) {
      const [email, password] = line.split(",");

      if (!email || !password || email.includes("email")) continue;

      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      try {
        await client.send(
          new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: cleanEmail,
            UserAttributes: [
              { Name: "email", Value: cleanEmail },
              { Name: "email_verified", Value: "true" },
            ],
            MessageAction: "SUPPRESS",
          }),
        );

        try {
          await client.send(
            new AdminSetUserPasswordCommand({
              UserPoolId: userPoolId,
              Username: cleanEmail,
              Password: cleanPass,
              Permanent: true,
            }),
          );

          results.push({ email: cleanEmail, status: "OK" });
        } catch (pwError: any) {
          console.warn(`パスワード設定失敗のためロールバック: ${cleanEmail}`);

          await client.send(
            new AdminDeleteUserCommand({
              UserPoolId: userPoolId,
              Username: cleanEmail,
            }),
          );

          throw pwError;
        }
      } catch (e: any) {
        let msg = e.message;
        if (e.name === "InvalidPasswordException") {
          msg = "パスワードポリシー違反（文字数や種類を確認してください）";
        } else if (e.name === "UsernameExistsException") {
          msg = "既に登録済みのメールアドレスです";
        }

        results.push({ email: cleanEmail, status: "Error", msg: msg });
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
