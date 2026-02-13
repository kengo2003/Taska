"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";

import Header from "@/components/common/Header";
import Title from "@/components/common/Title";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません。もう一度入力してください。");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      setMessage("パスワードを変更しました");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="md:hidden flex items-center justify-between p-3 border-b bg-white shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="relative w-24 h-8">
              <Image
                src="/TaskaLogo.png"
                alt="Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </Link>
        </div>
        <span className="text-sm font-bold text-gray-600 mr-2">設定</span>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">ホームに戻る</span>
            </Link>
          </div>

          <div className="mb-8 px-1">
            <Title text="パスワード変更" />
            <p className="text-sm text-gray-500 mt-2">
              セキュリティのため、定期的なパスワードの変更を推奨します。
            </p>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-start gap-2 animate-in fade-in">
                  <span className="font-bold shrink-0">Error:</span>
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-100 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="font-bold">Success:</span>
                  <span>{message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    現在のパスワード
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-gray-700"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-gray-700"
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2 ml-1">
                    ※8文字以上、大文字・小文字・数字を含めてください
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    新しいパスワード（確認）
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-gray-50 border transition-all outline-none text-gray-700 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                        : "border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    }`}
                    placeholder="確認のためもう一度入力してください"
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-2 ml-1">
                      パスワードが一致していません
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-6">
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (confirmPassword !== "" && newPassword !== confirmPassword)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-lg shadow-md hover:shadow-lg transform transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "変更を保存する"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
