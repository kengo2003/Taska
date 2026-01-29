import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// 1. クライアントの設定
// ここで .env に追加した AWS_ACCESS_KEY_ID 等を使います
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
    const userPoolId = process.env.COGNITO_USER_POOL_ID!; // "us-east-1_4IAcnDSYZ"

    // 改行コードで分割してリスト化
    const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim() !== "");
    const results = [];

    for (const line of lines) {
      // カンマ区切りで分解
      const [email, password] = line.split(",");

      // ヘッダー行や空行、データ不足をスキップ
      if (!email || !password || email.includes("email")) continue;

      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      try {
        // ① ユーザー作成（メール送信なし）
        await client.send(
          new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: cleanEmail,
            UserAttributes: [
              { Name: "email", Value: cleanEmail },
              { Name: "email_verified", Value: "true" },
            ],
            MessageAction: "SUPPRESS",
          })
        );

        // ② パスワード固定化（Permanent: true）
        // これにより「初回ログイン時の変更」が不要になります
        await client.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: cleanEmail,
            Password: cleanPass,
            Permanent: true, 
          })
        );

        results.push({ email: cleanEmail, status: "OK" });
      } catch (e: any) {
        // エラー（既に存在するなど）
        results.push({ email: cleanEmail, status: "Error", msg: e.message });
      }
      
      // AWSへの負荷軽減（API制限対策）
      await new Promise(r => setTimeout(r, 100));
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}