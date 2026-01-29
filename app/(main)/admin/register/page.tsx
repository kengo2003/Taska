"use client";
import { useState } from "react";

export default function BulkRegisterPage() {
  const [csvText, setCsvText] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!csvText) return;
    setLoading(true);
    setLogs([]);

    try {
      const res = await fetch("/api/login/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      setLogs(data.results || []);
    } catch (e) {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">一括ユーザー登録</h1>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2 font-bold">
          Excelから「メールアドレス, パスワード」の2列をコピーして貼り付けてください
        </p>
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder={`student1@example.com,Pass1234!\nstudent2@example.com,Pass5678!`}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 disabled:opacity-50 font-bold shadow"
      >
        {loading ? "登録処理中..." : "一括登録を実行する"}
      </button>

      {/* 結果表示 */}
      {logs.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold mb-2 text-lg">実行結果</h2>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">結果</th>
                  <th className="p-3 border-b">詳細</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className={log.status === "Error" ? "bg-red-50" : "bg-white"}>
                    <td className="p-3 border-b">{log.email}</td>
                    <td className="p-3 border-b font-bold">
                      {log.status === "OK" ? (
                        <span className="text-green-600">成功</span>
                      ) : (
                        <span className="text-red-600">失敗</span>
                      )}
                    </td>
                    <td className="p-3 border-b text-gray-500">{log.msg || "-"}</td>
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