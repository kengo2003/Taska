"use client";
import { useState } from "react";

// 結果の型定義
type DeleteLog = {
  email: string; // ここをusernameからemailに変更
  status: "deleted" | "failed";
  error?: string;
};

export default function AdminDeletePage() {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<DeleteLog[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    const text = await file.text();
    const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);

    // ヘッダー除去 (1行目が 'email' の場合)
    if (lines.length > 0 && lines[0].toLowerCase() === "email") {
      lines.shift();
    }

    if (lines.length === 0) {
      alert("有効なデータが含まれていません");
      return;
    }

    const confirmMsg = `⚠️ 警告 ⚠️\n\n${lines.length} 件のユーザーをメールアドレス検索で削除します。\n本当に実行しますか？`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setLogs([]);

    try {
      const res = await fetch("/api/auth/delete-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API側が期待するキー名 "emails" で送信
        body: JSON.stringify({ emails: lines }),
      });

      const data = await res.json();
      setLogs(data.results || []);
    } catch (e) {
      alert("エラーが発生しました");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        利用者一括削除 (Email指定)
      </h1>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 text-sm text-red-800">
        <h3 className="font-bold mb-2 text-base flex items-center gap-2">
          ⚠️ 削除操作に関する重要なお知らせ
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>この操作は取り消せません。</b>
          </li>
          <li>
            CSVファイルの1行目はヘッダー（例: <code>email</code>）として無視されます。
          </li>
          <li>
            削除対象の<b>「メールアドレス」</b>を1列目に記載してください。
            <br />
            <span className="text-xs text-gray-500">
              ※システムがメールアドレスからユーザーを検索し、削除を実行します。
            </span>
          </li>
        </ul>
      </div>

      <div className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
        <label className="block mb-4 text-lg font-bold text-gray-700">
          削除リストCSV (Email) を選択
        </label>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-red-100 file:text-red-700
            hover:file:bg-red-200
            cursor-pointer mx-auto max-w-md"
        />

        {file && (
          <p className="mt-4 text-gray-800 font-bold">選択中: {file.name}</p>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={loading || !file}
        className="w-full bg-red-600 text-white px-8 py-4 rounded hover:bg-red-700 disabled:opacity-50 font-bold shadow transition-colors text-lg"
      >
        {loading ? "検索して削除を実行中..." : "アップロードして一括削除を実行"}
      </button>

      {logs.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold mb-3 text-xl border-b pb-2">
            実行結果レポート
          </h2>
          <div className="border rounded overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border-b w-1/3">Email</th>
                  <th className="p-3 border-b w-24">結果</th>
                  <th className="p-3 border-b">詳細メッセージ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={i}
                    className={
                      log.status === "failed"
                        ? "bg-yellow-50 border-b last:border-0"
                        : "bg-white border-b last:border-0"
                    }
                  >
                    <td className="p-3 font-mono">{log.email}</td>
                    <td className="p-3 font-bold">
                      {log.status === "deleted" ? (
                        <span className="text-red-600 flex items-center">
                          🗑️ 削除
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center">
                          ⚠️ スキップ
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {log.error || "正常に削除されました"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}