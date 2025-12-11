import { Menu } from 'lucide-react';
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
    // Updated background to match the login screen's light blue theme
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-white via-[#EBF5FF] to-[#A6D6F3] border-r border-blue-100 flex flex-col hidden md:flex">
      <div className="p-4">
        <button className="p-2 hover:bg-blue-100 rounded-md transition-colors text-blue-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className="px-4 mb-6">
        <NewChatButton onClick={onNewChat} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-blue-200 pb-4">
        <div className="text-xs text-blue-400 mb-2 font-bold tracking-wide">HISTORY</div>
        <ul className="space-y-2">
          {sessions.length === 0 && (
            <li className="text-xs text-blue-300 text-center py-4">No history yet</li>
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