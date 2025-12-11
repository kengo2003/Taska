import { MessageSquare, Trash2 } from 'lucide-react';
import { ChatSession } from '@/types';

type Props = {
  session: ChatSession;
  isActive: boolean;
  onSelect: (session: ChatSession) => void;
  onDelete: (e: React.MouseEvent, sessionId: string) => void;
};

const ChatHistoryItem = ({ session, isActive, onSelect, onDelete }: Props) => {
  return (
    <li className="group relative">
      <button
        onClick={() => onSelect(session)}
        className={`w-full text-left p-3 rounded-lg text-sm flex items-start gap-3 transition-all ${
          isActive 
            ? 'bg-white text-blue-600 font-bold shadow-sm border border-blue-100' 
            : 'hover:bg-white/60 text-gray-600 hover:text-blue-500'
        }`}
      >
        <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="truncate">{session.title}</div>
          <div className="text-[10px] opacity-60 font-normal mt-0.5">{session.date}</div>
        </div>
      </button>

      <button
        onClick={(e) => onDelete(e, session.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
};

export default ChatHistoryItem;