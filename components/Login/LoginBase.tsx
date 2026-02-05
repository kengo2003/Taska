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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.endsWith("@hcs.ac.jp")) {
        throw new Error("学校のメールアドレス（@hcs.ac.jp）を入力してください");
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await loginRes.json().catch(() => null);

      if (!loginRes.ok) {
        throw new Error(data?.error ?? "IDまたはパスワードが間違っています");
      }

      // const groups = data.groups ?? [];

      // if (groups.includes("Teachers")) {
      //   router.push("/teacher");
      // } else if (groups.includes("Students")) {
      //   router.push("/student");
      // } else {
      //   router.push("/");
      // }
      router.push("/");
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
          width={350}
          height={150}
          className="object-contain"
          priority
          unoptimized 
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
          className="mb-2"
        />

        <div className="flex justify-end w-full mb-8">
          <Link 
            href="/api/auth/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            パスワードを忘れた場合
          </Link>
        </div>

        <LoginButton isLoading={isLoading} />
      </form>
    </div>
  );
}