import { Menu, History } from 'lucide-react';
import { ChatSession } from '@/types';
import { NewChatButton} from './NewChatButton';
import ChatHistoryItem from './ChatHistoryItem';

type Props = {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
};

const Sidebar = ({ sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession }: Props) => {
  return (
    // ★デザイン変更: 共通サイドバーと同じグラデーション(from-[#F5F5F5] to-[#94BBD9])を適用
    <aside className="w-64 flex-shrink-0 bg-linear-to-b from-[#F5F5F5] to-[#94BBD9] border-r border-gray-200 flex flex-col hidden md:flex">
      
      {/* ヘッダー部分 */}
      <div className="p-4">
        {/* メニューアイコンではなく、明示的に「履歴」と分かるヘッダーに変更（共通サイドバーがあるため） */}
        <div className="flex items-center gap-2 text-gray-600 font-bold px-2 mb-2">
          <History className="w-4 h-4" />
          <span className="text-sm">チャット履歴</span>
        </div>
      </div>
      
      <div className="px-4 mb-6">
        <NewChatButton onClick={onNewChat} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-300 pb-4">
        {/* ラベル色を青系からグレー系に変更し、全体のトーンを統一 */}
        <div className="text-xs text-gray-500 mb-2 font-bold tracking-wide">HISTORY</div>
        <ul className="space-y-2">
          {sessions.length === 0 && (
            <li className="text-xs text-gray-500 text-center py-4">履歴はありません</li>
          )}
          
          {sessions.map((session) => (
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
    </aside>
  );
};

export default Sidebar;