import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { 
  CognitoIdentityProviderClient, 
  GetUserCommand 
} from "@aws-sdk/client-cognito-identity-provider";

const cookieName = process.env.AUTH_COOKIE_NAME || "taska_session";

// ▼▼▼ 修正: 認証情報を明示して高速化・安定化 ▼▼▼
const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  try {
    const command = new GetUserCommand({ AccessToken: token });
    const user = await client.send(command);

    // UserAttributes から email を探す
    const emailAttr = user.UserAttributes?.find((attr) => attr.Name === "email");
    const email = emailAttr?.Value;

    // トークンからグループ情報を簡易取得
    const parts = token.split('.');
    let groups: string[] = [];
    if (parts.length > 1) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        groups = payload["cognito:groups"] ?? [];
      } catch (e) {
        console.error("Token parse error", e);
      }
    }

    return NextResponse.json({
      loggedIn: true,
      email: email,
      groups: groups,
      sub: user.Username, 
    });

  } catch (error) {
    console.error("Auth Me Error:", error);
    // トークン期限切れなどでGetUserが失敗した場合
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
}