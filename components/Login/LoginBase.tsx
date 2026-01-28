"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoginInput } from "@/components/Login/LoginInput";
import { LoginButton } from "@/components/Login/LoginButton";

type MeResponse =
  | { loggedIn: true; email?: string; groups: string[]; sub?: string }
  | { loggedIn: false };

export default function LoginBase() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // UX: 学校ドメイン制限（最終防衛はAPI/Cognito）
      if (!email.endsWith("@hcs.ac.jp")) {
        throw new Error("学校のメールアドレス（@hcs.ac.jp）を入力してください");
      }

      // Cognito認証（BFF）
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => null);
        // エラー理由があれば表示に使える
        throw new Error(data?.error ?? "IDまたはパスワードが間違っています");
      }

      // ロール取得して遷移先分岐
      const meRes = await fetch("/api/auth/me", { method: "GET" });
      const me: MeResponse = await meRes.json();

      if (!("loggedIn" in me) || !me.loggedIn) {
        // cookieが付かない等
        throw new Error("ログイン状態を確認できませんでした");
      }

      const groups = me.groups ?? [];
      if (groups.includes("Teachers")) {
        router.push("/teacher");
      } else if (groups.includes("Students")) {
        router.push("/student");
      } else {
        // グループ未設定ユーザ
        router.push("/"); // or /forbidden
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(
        "ログインに失敗しました\n" +
          (error instanceof Error
            ? error.message
            : "IDまたはパスワードを確認してください"),
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
      <div className="mb-12 relative w-64 h-20">
        <Image
          src="/TaskaLogo.png"
          alt="Taska Logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm px-8">
        <LoginInput
          id="email"
          type="email"
          label="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="xxx@hcs.ac.jp"
          className="mb-6"
        />

        <LoginInput
          id="password"
          type="password"
          label="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="xxxxxxxx"
          className="mb-10"
        />

        <LoginButton isLoading={isLoading} />
      </form>
    </div>
  );
}
