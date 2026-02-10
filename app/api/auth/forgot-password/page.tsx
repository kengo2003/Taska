"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginInput } from "@/components/Login/LoginInput";
// Amplifyのインポートは削除

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ステップ1: API経由でコード送信
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (!email.endsWith("@hcs.ac.jp")) {
        throw new Error("学校のメールアドレス（@hcs.ac.jp）を入力してください");
      }

      // 修正: バックエンドAPIを呼び出し
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "送信に失敗しました");
      }

      setStep(2);
      setMessage("認証コードを送信しました。メールを確認してください。");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "メール送信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // ステップ2: API経由でパスワード変更
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 修正: バックエンドAPIを呼び出し
      const res = await fetch("/api/auth/confirm-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "変更に失敗しました");
      }
      
      alert("パスワードを変更しました。新しいパスワードでログインしてください。");
      router.push("/login"); 
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "変更に失敗しました。コードが正しいか確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3] p-4">
      {/* ロゴエリア */}
      <div className="mb-8 relative w-full max-w-[350px] h-16 md:h-20 flex justify-center">
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

      <div className="w-full max-w-sm px-4 md:px-8">
        <h1 className="text-xl font-bold text-center text-gray-700 mb-6">
          {step === 1 ? "パスワード再設定" : "認証コードの入力"}
        </h1>

        {/* エラー表示エリア */}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
            {message}
          </div>
        )}

        {/* --- ステップ1: メールアドレス入力フォーム --- */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <p className="text-sm text-gray-600 mb-6 text-center">
              登録した学校のメールアドレスを入力してください。<br/>認証コードを送信します。
            </p>

            <LoginInput
              id="email"
              type="email"
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="xxx@hcs.ac.jp"
              className="mb-8"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "送信中..." : "認証コードを送信"}
            </button>
          </form>
        )}

        {/* --- ステップ2: コード＆新パスワード入力フォーム --- */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <p className="text-sm text-gray-600 mb-6 text-center">
              メールに届いた6桁のコードと、<br/>新しいパスワードを入力してください。
            </p>

            <LoginInput
              id="code"
              type="text"
              label="認証コード (6桁)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="mb-4"
            />

            <LoginInput
              id="newPassword"
              type="password"
              label="新しいパスワード"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8文字以上"
              className="mb-8"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-green-600 py-3 font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "変更中..." : "パスワードを変更する"}
            </button>
          </form>
        )}

        {/* 戻るリンク */}
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}