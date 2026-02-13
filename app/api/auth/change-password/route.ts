import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cookies } from "next/headers";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const { oldPassword, newPassword } = await request.json();

    const cookieStore = await cookies();

    const accessCookieName =
      process.env.AUTH_ACCESS_COOKIE_NAME || "taska_access";
    const accessToken = cookieStore.get(accessCookieName)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "認証されていません。再度ログインしてください。" },
        { status: 401 },
      );
    }

    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    });

    await client.send(command);

    return NextResponse.json({ message: "パスワード変更成功" });
  } catch (error: unknown) {
    console.error("Change Password Error:", error);

    const name = error instanceof Error ? error.name : "";

    let errorMessage = "パスワード変更に失敗しました";

    switch (name) {
      case "NotAuthorizedException":
        errorMessage =
          "現在のパスワードが間違っているか、セッションが切れています。";
        break;
      case "InvalidPasswordException":
        errorMessage =
          "新しいパスワードの要件（文字数、大文字小文字など）を満たしていません。";
        break;
      case "LimitExceededException":
        errorMessage =
          "試行回数が多すぎます。しばらく待ってから再試行してください。";
        break;
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
