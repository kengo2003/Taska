import React, { useRef } from "react";
import { Upload, X, Send, ImageIcon, Paperclip } from "lucide-react";

type Props = {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  selectedFiles: File[];
  onFileSelect: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
};

export const ChatInput = ({
  input,
  setInput,
  isLoading,
  onSend,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      onSend();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto shrink-0 mb-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,image/*"
      />

      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative bg-white border border-gray-200 rounded-md p-1.5 flex items-center gap-2 shadow-sm pr-7"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="w-3 h-3 text-purple-500" />
              ) : (
                <Paperclip className="w-3 h-3 text-blue-500" />
              )}
              <span className="text-xs font-bold text-gray-700 truncate max-w-30">
                {file.name}
              </span>
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute top-1/2 -translate-y-1/2 right-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center group">
        <div
          onClick={handleUploadClick}
          className="absolute left-4 text-gray-400 group-focus-within:text-blue-500 transition-colors cursor-pointer hover:bg-gray-100 p-1 rounded-full"
        >
          {selectedFiles.length > 0 ? (
            <div className="relative">
              <Upload className="w-5 h-5 text-blue-500" />
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                {selectedFiles.length}
              </span>
            </div>
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Taskaに相談"
          disabled={isLoading}
          className="w-full pl-12 pr-12 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 bg-white placeholder-gray-400 disabled:bg-gray-50"
        />

        <div className="absolute right-4 flex items-center gap-2">
          {input || selectedFiles.length > 0 ? (
            <button
              onClick={onSend}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setInput("")}
              className={`text-gray-400 ${!input && "hidden"}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
