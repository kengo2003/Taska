"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Send,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import Header from "@/components/common/Header";
import ChatSidebar from "@/components/Chat/Sidebar";

// --- 型定義 ---
type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: "image" | "file";
  }[];
};

type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  difyConversationId?: string;
};

// --- ヘルパー関数 ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const formatDate = (date: Date) =>
  `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;

export default function QABase() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [difyConversationId, setDifyConversationId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！**Taska Q&Aボット**です。\n学校生活、授業、施設、資格取得などについて、分からないことがあれば何でも聞いてください。",
    },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 150;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [input]);

  // --- ハンドラ ---

  const startNewChat = () => {
    setCurrentSessionId(null);
    setDifyConversationId("");
    setMessages([
      {
        role: "assistant",
        content: "新しいQ&Aチャットを開始しました。何か質問はありますか？",
      },
    ]);
    setSelectedFiles([]);
    setInput("");
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setDifyConversationId(session.difyConversationId || "");
    setMessages(session.messages);
    setSelectedFiles([]);
    setInput("");
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？")) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleFileClick = async (
    e: React.MouseEvent,
    url: string,
    name: string
  ) => {
    e.preventDefault();
    if (!url) return;
    try {
      if (url.startsWith("http") || url.startsWith("blob:")) {
        window.open(url, "_blank");
        return;
      }
      if (url.startsWith("data:")) {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, "_blank");
        if (!newWindow) {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = name;
          link.click();
        }
      }
    } catch (error) {
      console.error(error);
      alert("ファイルを開けませんでした。");
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    const messageToSend = input;
    const filesToSend = [...selectedFiles];

    let attachmentDataList: Message["attachments"] = [];
    if (filesToSend.length > 0) {
      try {
        const promises = filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "file",
          url: await fileToBase64(file),
        } as const));
        attachmentDataList = await Promise.all(promises);
      } catch (e) {
        console.error(e);
      }
    }

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
      attachments: attachmentDataList,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSelectedFiles([]);
    setIsLoading(true);

    // セッション管理
    let targetSessionId = currentSessionId;
    let newSessions = [...sessions];

    if (!targetSessionId) {
      targetSessionId = generateId();
      setCurrentSessionId(targetSessionId);
      const title = messageToSend.trim().substring(0, 20) || "Q&Aチャット";
      const newSession: ChatSession = {
        id: targetSessionId,
        title: title,
        date: formatDate(new Date()),
        messages: updatedMessages,
        difyConversationId: difyConversationId,
      };
      newSessions = [newSession, ...sessions];
    } else {
      const sessionIndex = newSessions.findIndex((s) => s.id === targetSessionId);
      if (sessionIndex !== -1) {
        const updatedSession = {
          ...newSessions[sessionIndex],
          messages: updatedMessages,
        };
        newSessions.splice(sessionIndex, 1);
        newSessions.unshift(updatedSession);
      }
    }
    setSessions(newSessions);

    try {
      const formData = new FormData();
      formData.append("query", messageToSend);
      formData.append("user", "local-user-qa"); // ユーザーIDを区別
      if (difyConversationId) {
        formData.append("conversation_id", difyConversationId);
      }

      filesToSend.forEach((file) => formData.append("file", file));

      const res = await fetch("/api/qa", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();

      if (data.conversation_id) {
        setDifyConversationId(data.conversation_id);
        const sessionIndex = newSessions.findIndex((s) => s.id === targetSessionId);
        if (sessionIndex !== -1) {
          newSessions[sessionIndex].difyConversationId = data.conversation_id;
          setSessions([...newSessions]);
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      const finalSessionIndex = newSessions.findIndex((s) => s.id === targetSessionId);
      if (finalSessionIndex !== -1) {
        newSessions[finalSessionIndex].messages = finalMessages;
        setSessions([...newSessions]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "エラーが発生しました。時間をおいて再試行してください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={startNewChat}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex overflow-hidden relative bg-white">
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            <div className="flex-1 flex flex-col px-4 md:px-8 pb-4 overflow-hidden">
              
              {/* ヘッダーエリア */}
              <div className="mt-4 mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 inline-block pb-1 mb-4">
                  学内Q&A
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HelpCircle className="w-4 h-4" />
                    <span>学校のルールや授業について質問できます</span>
                </div>
              </div>

              {/* メッセージリスト */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user"
                        ? "justify-end"
                        : "justify-start items-start gap-3"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0 bg-green-100 border border-green-200">
                        <div className="w-full h-full flex items-center justify-center text-green-600 text-xs font-bold">
                          Q
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#EBF5FF] text-gray-800 rounded-tr-none"
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href="#"
                              onClick={(e) =>
                                handleFileClick(e, att.url, att.name)
                              }
                              className="block hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              {att.type === "image" ? (
                                <div className="rounded-lg overflow-hidden border border-gray-200 w-32 h-32 bg-gray-50">
                                  <img
                                    src={att.url || "/placeholder.png"}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-blue-200/50 hover:bg-blue-50 transition-colors w-fit max-w-[200px]">
                                  <div className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                  <span className="font-medium text-gray-700 text-xs truncate">
                                    {att.name}
                                  </span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="prose prose-sm max-w-none text-gray-800 break-words [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              />
                            ),
                            p: ({ node, ...props }) => (
                              <p {...props} className="mb-2 last:mb-0" />
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                    <div className="text-gray-400 text-sm">回答を生成中...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 入力エリア */}
              <div className="relative w-full max-w-4xl mx-auto flex-shrink-0 mb-2">
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                />

                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-white border border-gray-200 rounded-md p-1.5 flex items-center gap-2 shadow-sm pr-7"
                      >
                        <div className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1/2 -translate-y-1/2 right-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative flex items-end group">
                  <div
                    onClick={handleUploadClick}
                    className="absolute left-4 bottom-4 text-gray-400 group-focus-within:text-blue-500 transition-colors cursor-pointer hover:bg-gray-100 p-1 rounded-full"
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

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ここに質問を入力..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full pl-12 pr-12 py-4 rounded-[28px] border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 bg-white placeholder-gray-400 disabled:bg-gray-50 resize-none overflow-hidden min-h-[56px] leading-relaxed"
                  />

                  <div className="absolute right-4 bottom-4 flex items-center gap-2">
                    {input || selectedFiles.length > 0 ? (
                      <button
                        onClick={handleSend}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}