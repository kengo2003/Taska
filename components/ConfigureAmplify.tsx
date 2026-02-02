"use client";

import { Amplify } from "aws-amplify";
import { useEffect } from "react";

// Amplifyの設定
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    },
  },
});

export default function ConfigureAmplify() {
  return null; // UIには何も表示しない
}