"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

// 評価の状態：未評価(null), 高評価(good), 低評価(bad)
type VoteType = "good" | "bad" | null;

type FeedbackButtonsProps = {
  messageId: string;
  responseContent: string;
};

export default function FeedbackButtons({ messageId, responseContent }: FeedbackButtonsProps) {
  const [currentVote, setCurrentVote] = useState<VoteType>(null);
  const [isSending, setIsSending] = useState(false);

  const handleVote = async (type: "good" | "bad") => {
    // 連打防止
    if (isSending) return;

    // ロジック:
    // 1. 同じボタンを再度押した -> 取り消し (null)
    // 2. 違うボタンを押した -> 変更 (good <-> bad)
    const nextVote = currentVote === type ? null : type;
    
    // UIを先に更新してサクサク動かす (Optimistic UI)
    const prevVote = currentVote;
    setCurrentVote(nextVote);
    setIsSending(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          vote: nextVote, // nullを送ることで「取り消し」としてログに残す
          content: responseContent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Feedback failed:", error);
      alert("評価の送信に失敗しました");
      setCurrentVote(prevVote); // エラー時は見た目を戻す
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100/50 items-center">
      {/* Goodボタン */}
      <button
        onClick={() => handleVote("good")}
        disabled={isSending}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          currentVote === "good"
            ? "bg-blue-100 text-blue-600 ring-1 ring-blue-300" // 選択中: 色付き
            : "text-gray-400 hover:bg-gray-100 hover:text-blue-500" // 未選択
        }`}
        title={currentVote === "good" ? "評価を取り消す" : "役に立った"}
      >
        <ThumbsUp 
          className={`w-4 h-4 ${currentVote === "good" ? "fill-current" : ""}`} 
        />
      </button>

      {/* Badボタン */}
      <button
        onClick={() => handleVote("bad")}
        disabled={isSending}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          currentVote === "bad"
            ? "bg-red-100 text-red-600 ring-1 ring-red-300" // 選択中: 色付き
            : "text-gray-400 hover:bg-gray-100 hover:text-red-500" // 未選択
        }`}
        title={currentVote === "bad" ? "評価を取り消す" : "役に立たなかった"}
      >
        <ThumbsDown 
          className={`w-4 h-4 ${currentVote === "bad" ? "fill-current" : ""}`} 
        />
      </button>

      {/* 状態テキスト（誤操作した人が「あ、取り消せた」と分かるように） */}
      <span className="text-[10px] text-gray-300 ml-1 transition-opacity duration-300">
        {currentVote === "good" && "高評価済み"}
        {currentVote === "bad" && "低評価済み"}
      </span>
    </div>
  );
}