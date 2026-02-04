"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, Home, Lock, CheckCircle } from "lucide-react";

import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Title from "@/components/common/Title";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // 確認用パスワードの状態管理
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    // パスワード一致チェック
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
      setConfirmPassword(""); // 確認用もクリア
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 設定ページ用のサイドバーコンテンツ
  const SettingsSidebarContent = () => (
    <div className="p-4 w-64">
      <div className="flex items-center gap-2 text-gray-600 font-bold px-2 mb-6">
        <Settings className="w-5 h-5" />
        <span>設定メニュー</span>
      </div>

      <nav className="space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">ホームに戻る</span>
        </Link>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar>
        <SettingsSidebarContent />
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
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

                  {/* 確認用パスワード入力欄 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
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
                      (confirmPassword !== "" &&
                        newPassword !== confirmPassword)
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
    </div>
  );
}
