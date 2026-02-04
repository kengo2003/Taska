"use client";
import { useState } from "react";

export default function BulkRegisterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    setLoading(true);
    setLogs([]);

    try {
      const text = await file.text();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
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
        CSVアップロード登録
      </h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 text-sm text-yellow-800">
        <h3 className="font-bold mb-2 text-base">
          ⚠️ CSV作成時の重要なお知らせ
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Excelで保存する際は、ファイルの種類で
            <b>「CSV UTF-8 (コンマ区切り) (*.csv)」</b>を選択してください。
            <br />
            <span className="text-xs text-gray-500">
              ※通常の「CSV
              (コンマ区切り)」だと文字化けしてエラーになる場合があります。
            </span>
          </li>
          <li>
            1行目はヘッダーとして無視されます。データは2行目から入力してください。
          </li>
          <li>
            パスワードは<b>「8文字以上」</b>かつ
            <b>「数字・大文字・小文字・記号」</b>をすべて含める必要があります。
          </li>
        </ul>
      </div>

      <div className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
        <label className="block mb-4 text-lg font-bold text-gray-700">
          ユーザーリストCSVを選択
        </label>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-100 file:text-blue-700
            hover:file:bg-blue-200
            cursor-pointer mx-auto max-w-md"
        />

        {file && (
          <p className="mt-4 text-green-600 font-bold">選択中: {file.name}</p>
        )}
      </div>

      <button
        onClick={handleRegister}
        disabled={loading || !file}
        className="w-full bg-blue-600 text-white px-8 py-4 rounded hover:bg-blue-700 disabled:opacity-50 font-bold shadow transition-colors text-lg"
      >
        {loading ? "登録処理を実行中..." : "アップロードして一括登録"}
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
                      log.status === "Error"
                        ? "bg-red-50"
                        : "bg-white border-b last:border-0"
                    }
                  >
                    <td className="p-3">{log.email}</td>
                    <td className="p-3 font-bold">
                      {log.status === "OK" ? (
                        <span className="text-green-600 flex items-center">
                          ✅ 成功
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          ❌ 失敗
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {log.msg || "登録完了"}
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
