"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  // 入力フォームの状態
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UIの状態
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 簡易バリデーション
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "新しいパスワードが一致しません。" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "パスワードは8文字以上である必要があります。" });
      return;
    }

    setLoading(true);

    try {
      // フォルダ名を 'auth/change-password' に変更した前提のパスです
      // もし 'auth/change_pass' のままであれば、末尾を change_pass にしてください
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // サーバー側で作った日本語エラーメッセージ (data.error) をそのままエラーとして投げる
        throw new Error(data.error || "エラーが発生しました");
      }

      setMessage({ type: "success", text: "パスワードが正常に変更されました。" });
      
      // フォームをクリア
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.error("Password change error:", error);
      
      // サーバーから受け取ったメッセージをそのまま表示
      // (サーバー側で日本語化済みのため、ここでの分岐は不要)
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">パスワード変更</h1>

      {message && (
        <div className={`p-4 mb-6 rounded ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? "✅ " : "⚠️ "}
          {message.text}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-6">
        {/* 現在のパスワード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            現在のパスワード
          </label>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="現在のパスワードを入力"
          />
        </div>

        {/* 新しいパスワード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="8文字以上、大文字・数字・記号を含む"
          />
          <p className="text-xs text-gray-500 mt-1">
            ※8文字以上で、数字・大文字・小文字・記号を含める必要があります。
          </p>
        </div>

        {/* 新しいパスワード（確認） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="新しいパスワードを再入力"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
        >
          {loading ? "変更処理中..." : "パスワードを変更する"}
        </button>
      </form>
    </div>
  );
}