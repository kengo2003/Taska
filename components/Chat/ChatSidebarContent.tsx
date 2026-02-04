import { History } from "lucide-react";
import { ChatSession } from "@/types/type";
import { NewChatButton } from "./NewChatButton";
import ChatHistoryItem from "./ChatHistoryItem";

type Props = {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
};

const ChatSidebarContent = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: Props) => {
  // 日付でグループ化
  const groupedSessions: { [key: string]: ChatSession[] } = {
    今日: [],
    昨日: [],
    それ以前: [],
  };

  sessions.forEach((session) => {
    const d = new Date(session.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      groupedSessions["今日"].push(session);
    } else if (d.toDateString() === yesterday.toDateString()) {
      groupedSessions["昨日"].push(session);
    } else {
      groupedSessions["それ以前"].push(session);
    }
  });

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 flex flex-col md:flex">
      {/*ヘッダーとNewChatButtonは同じ*/}
      <div className="p-4">
        <div className="flex items-center gap-2 text-gray-600 font-bold px-2 mb-2">
          <History className="w-4 h-4" />
          <span className="text-sm">チャット履歴</span>
        </div>
      </div>
      <div className="px-4 mb-6">
        <NewChatButton onClick={onNewChat} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin pb-4">
        {/* グループごとに表示 */}
        {Object.entries(groupedSessions).map(
          ([label, groupSessions]) =>
            groupSessions.length > 0 && (
              <div key={label} className="mb-4">
                <div className="text-xs text-gray-500 mb-2 font-bold tracking-wide">
                  {label}
                </div>
                <ul className="space-y-2">
                  {groupSessions.map((session) => (
                    <ChatHistoryItem
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onSelect={onSelectSession}
                      onDelete={onDeleteSession}
                    />
                  ))}
                </ul>
              </div>
            ),
        )}

        {sessions.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            履歴はありません
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebarContent;
