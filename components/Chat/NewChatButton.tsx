import { SquarePen } from "lucide-react";

type Props = {
  onClick: () => void;
};

export const NewChatButton = ({ onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium w-full text-left bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:border-blue-300"
    >
      <SquarePen className="w-5 h-5" />
      <span>新しいチャット</span>
    </button>
  );
};
