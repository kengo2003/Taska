"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { LoginInput } from "@/components/Login/LoginInput"; // 既存のコンポーネントを再利用

export default function ForgotPasswordPage() {
  const router = useRouter();

  // 状態管理: step 1 = メール入力, step 2 = コードと新パスワード入力
  const [step, setStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ステップ1: 認証コードを送信する処理
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (!email.endsWith("@hcs.ac.jp")) {
        throw new Error("学校のメールアドレス（@hcs.ac.jp）を入力してください");
      }

      await resetPassword({ username: email });
      setStep(2);
      setMessage("認証コードを送信しました。メールを確認してください。");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "メール送信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // ステップ2: 新しいパスワードを確定する処理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });
      
      alert("パスワードを変更しました。新しいパスワードでログインしてください。");
      router.push("/auth/signin"); // ログインページへ戻す（パスは適宜調整してください）
    } catch (err: any) {
      console.error(err);
      setError(err.message || "変更に失敗しました。コードが正しいか確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
      {/* ロゴエリア（ログイン画面と共通） */}
      <div className="mb-8 relative w-64 h-20">
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

      <div className="w-full max-w-sm px-8">
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
            href="/login" // ログイン画面のパスに合わせてください（/login または /auth/signin）
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}