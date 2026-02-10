"use client";
import { Amplify } from "aws-amplify";

// ▼ 追加: コンソールで値を確認する
console.log("Amplify Config:", {
  PoolID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ForgotID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_FORGOT_ID, // ←ここがundefinedだとエラーになる
});

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_FORGOT_ID || "",
    },
  },
});

export default function ConfigureAmplify() {
  return null;
}