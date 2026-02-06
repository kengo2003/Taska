"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginInput } from "@/components/Login/LoginInput";
import { LoginButton } from "@/components/Login/LoginButton";

export default function LoginBase() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); 

    try {
      if (!email.endsWith("@hcs.ac.jp")) {
        throw new Error("学校のメールアドレス(@hcs.ac.jp)を入力してください");
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await loginRes.json().catch(() => null);

      if (!loginRes.ok) {
        // ▼ ここでエラーメッセージを変換しています
        let errorMsg = data?.error;
        
        if (errorMsg === "auth_failed" || errorMsg === "NotAuthorizedException") {
          errorMsg = "メールアドレスまたはパスワードが間違っています";
        } else if (errorMsg === "UserNotFoundException") {
          errorMsg = "アカウントが見つかりません";
        }

        throw new Error(errorMsg ?? "IDまたはパスワードが間違っています");
      }

      // ログイン成功時はトップへ
      router.push("/");

    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "IDまたはパスワードを確認してください"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3] p-4">
      <div className="mb-8 md:mb-12 relative w-full max-w-[350px] h-16 md:h-20 flex justify-center">
        <Image
          src="/TaskaLogo.png"
          alt="Taska Logo"
          width={350}
          height={150}
          className="object-contain w-auto h-full"
          priority
          unoptimized 
        />
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm px-4 md:px-8">
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
          className="mb-2"
        />

        <div className="flex justify-end w-full mb-4">
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            パスワードを忘れた場合
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded relative" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <LoginButton isLoading={isLoading} />
      </form>
    </div>
  );
}