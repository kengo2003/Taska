import React from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { ChatSession } from "@/types/type";
import { NewChatButton } from "./NewChatButton";

interface ChatSidebarContentProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ChatSidebarContent({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  hasMore = false,
  onLoadMore,
}: ChatSidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 新規チャットボタン */}
      <div className="p-4 pb-2">
        <NewChatButton onClick={onNewChat} />
      </div>

      {/* 履歴リスト */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        <div className="text-xs font-bold text-gray-400 px-4 py-2 mb-1">
          履歴
        </div>

        <div className="space-y-1">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              履歴はありません
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group relative flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentSessionId === session.id
                    ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageSquare
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    currentSessionId === session.id
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  {/* タイトル */}
                  <div className="truncate text-sm mb-0.5 font-medium">
                    {session.title || "無題のチャット"}
                  </div>
                  
                  {/* 時間とメールアドレスの表示 */}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[10px] opacity-70 truncate font-mono text-gray-500">
                      {session.date}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* もっと見るボタン */}
        {hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            もっと見る
          </button>
        )}
      </div>
    </div>
  );
}