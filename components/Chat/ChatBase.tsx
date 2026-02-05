"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import SidebarButton from "@/components/common/SidebarButton";
import ChatSidebarContent from "@/components/Chat/ChatSidebarContent";
import { Message, ChatSession } from "@/types/type";
import {
  ANALYSIS_TEMPLATES,
  CREATE_TEMPLATES,
  CRITIQUE_TEMPLATES,
} from "@/Templates/data";
import Title from "../common/Title";

export type ChatMode = "analysis" | "create" | "critique";

// ヘルパー関数
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;

interface ChatBaseProps {
  mode: ChatMode;
}

export default function ChatBase({ mode }: ChatBaseProps) {
  // サイドバーの開閉状態管理
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 画面サイズに応じて初期状態を設定
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
  }, []);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [difyConversationId, setDifyConversationId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！**Taska**へようこそ。\nまずは上のタブから、やりたいことを選んでください。",
    },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初期化時に履歴一覧を取得
  useEffect(() => {
    const fetchHistoryIndex = async () => {
      try {
        const res = await fetch("/api/history?type=resume");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (e) {
        console.error("履歴の読み込みに失敗:", e);
      }
    };
    fetchHistoryIndex();
  }, []);

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

  const getCurrentTemplates = () => {
    switch (mode) {
      case "create":
        return CREATE_TEMPLATES;
      case "critique":
        return CRITIQUE_TEMPLATES;
      case "analysis":
        return ANALYSIS_TEMPLATES;
      default:
        return ANALYSIS_TEMPLATES;
    }
  };

  const getCurrentTitle = () => {
    switch (mode) {
      case "create":
        return "履歴書作成";
      case "critique":
        return "履歴書添削";
      case "analysis":
        return "自己分析";
      default:
        return "チャット";
    }
  };

  // ハンドラ
  const startNewChat = () => {
    setCurrentSessionId(null);
    setDifyConversationId("");
    setMessages([
      { role: "assistant", content: "新しいチャットを開始しました。" },
    ]);
    setSelectedFiles([]);
    setInput("");
    
    // モバイルの場合は新規チャット開始時にサイドバーを閉じる
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setDifyConversationId(session.difyConversationId || "");

    setMessages(
      session.messages && session.messages.length > 0 ? session.messages : [],
    );
    setIsLoading(true);
    
    // モバイルの場合はセッション選択時にサイドバーを閉じる
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    try {
      const res = await fetch(`/api/history/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages);

        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, messages: loadedMessages } : s,
          ),
        );
      } else {
        console.error("履歴詳細の取得に失敗しました");
      }
    } catch (e) {
      console.error("詳細読み込みエラー:", e);
    } finally {
      setIsLoading(false);
      setSelectedFiles([]);
      setInput("");
    }
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？\n※S3上のファイルも削除されます")) return;

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }

    try {
      const res = await fetch(`/api/history/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("削除に失敗しました");
      }
      console.log("削除完了:", sessionId);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("サーバー上の削除に失敗しました（画面上は削除されました）");
    }
  };

  const handleTemplateClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
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
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleFileClick = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (!url) return;
    try {
      window.open(url, "_blank");
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
        const promises = filesToSend.map(
          async (file) =>
            ({
              name: file.name,
              type: file.type.startsWith("image/") ? "image" : "file",
              url: await fileToBase64(file),
            }) as const,
        );
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

    const tempMessages = [...messages, userMessage];
    setMessages(tempMessages);
    setInput("");
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("query", messageToSend);
      formData.append("user", "client-user");

      if (currentSessionId) {
        formData.append("conversation_id", currentSessionId);
      }
      if (difyConversationId) {
        formData.append("dify_conversation_id", difyConversationId);
      }

      filesToSend.forEach((file) => formData.append("file", file));

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const data = await res.json();

      const serverSessionId = data.conversation_id;
      const newDifyId = data.dify_conversation_id;

      if (serverSessionId) {
        setCurrentSessionId(serverSessionId);
        if (newDifyId) setDifyConversationId(newDifyId);

        setSessions((prev) => {
          const exists = prev.find((s) => s.id === serverSessionId);
          if (exists) return prev;

          const newSession: ChatSession = {
            id: serverSessionId,
            title: messageToSend.trim().substring(0, 20) || getCurrentTitle(),
            date: formatDate(new Date()),
            messages: [],
            difyConversationId: newDifyId,
          };
          return [newSession, ...prev];
        });
      }

      let assistantAttachments: Message["attachments"] = [];
      if (data.files && Array.isArray(data.files)) {
        assistantAttachments = data.files.map(
          (file: { type?: string; name?: string; url: string }) => {
            const isImage =
              file.type === "image" ||
              /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name || "");

            return {
              name: file.name || "Generated File",
              url: file.url,
              type: isImage ? "image" : "file",
            };
          },
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        attachments: assistantAttachments,
      };

      const finalMessages = [...tempMessages, assistantMessage];
      setMessages(finalMessages);

      setSessions((prev) => {
        return prev.map((s) => {
          if (s.id === (serverSessionId || currentSessionId)) {
            return {
              ...s,
              messages: finalMessages,
              difyConversationId: newDifyId || s.difyConversationId,
            };
          }
          return s;
        });
      });
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
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}>
        <ChatSidebarContent
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={startNewChat}
          onSelectSession={loadSession}
          onDeleteSession={deleteSession}
        />
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* PC用ヘッダー (md以上で表示) */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* モバイル用ヘッダー (md未満で表示) */}
        <div className="md:hidden flex items-center justify-between p-3 border-b bg-linear-to-r from-[#F5F5F5] to-[#94BBD9] shrink-0 sticky top-0 z-10">
           <div className="flex items-center gap-3">
             <SidebarButton 
               isOpen={isSidebarOpen} 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             />
             <Link href={"/"}>
               <div className="relative w-24 h-8">
                 <Image
                   src="/TaskaLogo.png"
                   alt="Logo"
                   fill
                   className="object-contain"
                   unoptimized
                 />
               </div>
             </Link>
           </div>
        </div>

        <main className="flex-1 flex overflow-hidden relative bg-white">
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            <div className="flex-1 flex flex-col px-4 md:px-8 pb-4 overflow-hidden">
              <div className="mt-4 mb-4 shrink-0">
                <Title text={getCurrentTitle()} />

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/chat/analysis"
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      mode === "analysis"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    自己分析
                  </Link>
                  <Link
                    href="/chat/create"
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      mode === "create"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    履歴書作成
                  </Link>
                  <Link
                    href="/chat/critique"
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      mode === "critique"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    履歴書添削
                  </Link>
                </div>
              </div>

              {/* メッセージリスト */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
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
                      <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 bg-blue-100 border border-blue-200">
                        <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-bold">
                          T
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
                      {/* メッセージ内容の表示ロジックは既存のまま */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href="#"
                              onClick={(e) => handleFileClick(e, att.url)}
                              className="block hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              {att.type === "image" ? (
                                <div className="rounded-lg overflow-hidden border border-gray-200 w-32 h-32 bg-gray-50">
                                  <Image
                                    src={att.url || "/placeholder.png"}
                                    alt="preview"
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-blue-200/50 hover:bg-blue-50 transition-colors w-fit max-w-[200px]">
                                  <div className="w-5 h-5 text-blue-500 shrink-0" />
                                  <span className="font-medium text-gray-700 text-xs truncate">
                                    {att.name}
                                  </span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="prose prose-sm max-w-none text-gray-800 wrap-break-words [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            a: ({ ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              />
                            ),
                            p: ({ ...props }) => (
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
                    <div className="text-gray-400 text-sm">
                      Taskaが入力中...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 入力エリア */}
              <div className="relative w-full max-w-4xl mx-auto shrink-0 mb-2">
                <div className="mb-3">
                   {/* テンプレート表示トグル */}
                   <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      おすすめの質問（{getCurrentTitle()}）
                    </span>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showTemplates ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {showTemplates && (
                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 -mx-4 px-4 md:mx-0 md:px-1">
                      {/* ^^^ モバイルで左右のマージンをネガティブにして画面端まで広げる(-mx-4 px-4) */}
                      {getCurrentTemplates().map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateClick(template.prompt)}
                          className="shrink-0 flex items-center gap-2 p-2 md:p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all text-left shadow-sm group min-w-[150px] md:min-w-[180px] max-w-[180px] md:max-w-60"
                        >
                          {/* ^^^ ボタンサイズもモバイル向けに少し小さく調整 (min-w, max-w, p) */}
                          <div className="p-1.5 bg-gray-50 rounded-md group-hover:bg-white transition-colors shrink-0">
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-700 text-xs truncate mb-0.5">
                              {template.label}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {template.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
                    placeholder="Taskaに相談"
                    disabled={isLoading}
                    rows={1}
                    className="w-full pl-12 pr-12 py-4 rounded-[28px] border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 bg-white placeholder-gray-400 disabled:bg-gray-50 resize-none overflow-hidden min-h-14 leading-relaxed"
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