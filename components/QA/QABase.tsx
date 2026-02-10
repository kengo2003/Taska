"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import SidebarButton from "@/components/common/SidebarButton";
import ChatSidebarContent from "@/components/Chat/ChatSidebarContent";

import { ChatSession, Message } from "@/types/type";
import Image from "next/image";
import Link from "next/link";
import FeedbackButtons from "@/components/Chat/FeedbackButtons";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const getCurrentFormattedDate = () => {
  const now = new Date();
  return `${now.getFullYear()}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")} ${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
};

export default function QABase() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    const initialMobile = checkMobile();
    setIsMobile(initialMobile);
    if (!initialMobile) setIsSidebarOpen(true);
    else setIsSidebarOpen(false);

    let prevIsMobile = initialMobile;
    const handleResize = () => {
      const currentIsMobile = checkMobile();
      setIsMobile(currentIsMobile);
      if (currentIsMobile !== prevIsMobile) {
        if (!currentIsMobile) setIsSidebarOpen(true);
        else setIsSidebarOpen(false);
        prevIsMobile = currentIsMobile;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [difyConversationId, setDifyConversationId] = useState<string>("");

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！**学内Q&Aボット**です。\n学校生活、授業、施設、資格取得などについて、分からないことがあれば何でも聞いてください。",
    },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [historyLimit, setHistoryLimit] = useState(5);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history?type=qa&limit=${historyLimit + 1}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length > historyLimit) {
            setHasMoreHistory(true);
            setSessions(data.slice(0, historyLimit));
          } else {
            setHasMoreHistory(false);
            setSessions(data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, [historyLimit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadMore = () => {
    setHistoryLimit((prev) => prev + 5);
  };

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
    if (isMobile) setIsSidebarOpen(false);
  };

  const loadSession = async (session: ChatSession) => {
    if (currentSessionId === session.id) return;
    setCurrentSessionId(session.id);
    setMessages([]);
    setIsLoading(true);
    if (isMobile) setIsSidebarOpen(false);

    try {
      const res = await fetch(`/api/history/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.messages) {
          setMessages(data.messages);
          setDifyConversationId(data.difyConversationId || "");
        }
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
      setSelectedFiles([]);
      setInput("");
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

  // メッセージ送信処理
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
        }));
        // @ts-expect-error type
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

    // ★ 楽観的更新 (Optimistic UI)
    let tempSessionId: string | null = null;
    if (!currentSessionId) {
      tempSessionId = "temp-" + Date.now();
      const tempSession: ChatSession = {
        id: tempSessionId,
        title: messageToSend.substring(0, 20) || "QAチャット",
        date: getCurrentFormattedDate(),
        email: "",
        messages: [userMessage],
        type: "qa",
      };
      setSessions((prev) => [tempSession, ...prev]);
    }

    try {
      const formData = new FormData();
      formData.append("query", messageToSend);
      if (difyConversationId) {
        formData.append("dify_conversation_id", difyConversationId);
      }
      if (currentSessionId) {
        formData.append("conversation_id", currentSessionId);
      }
      filesToSend.forEach((file) => formData.append("file", file));

      const res = await fetch("/api/qa", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(res.statusText);

      // ★ IDの置換処理
      const serverSessionId = res.headers.get("X-Conversation-ID");
      const serverDifyId = res.headers.get("X-Dify-Conversation-ID");

      if (serverSessionId) {
        if (!currentSessionId || (tempSessionId && !currentSessionId)) {
          setCurrentSessionId(serverSessionId);
          if (serverDifyId) setDifyConversationId(serverDifyId);

          const idToReplace = currentSessionId || tempSessionId;
          if (idToReplace) {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === idToReplace) {
                  return {
                    ...s,
                    id: serverSessionId,
                    difyConversationId: serverDifyId || s.difyConversationId,
                  };
                }
                return s;
              })
            );
          }
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // ★ ストリーム処理
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedAnswer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          accumulatedAnswer += textChunk;

          setMessages((prev) => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.content = accumulatedAnswer;
            }
            return newMsgs;
          });
        }
      }

      // ストリーム完了後のセッション情報の更新
      const finalSessionId = serverSessionId || currentSessionId || tempSessionId;
      if (finalSessionId) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === finalSessionId) {
              return {
                ...s,
                messages: [
                  ...updatedMessages,
                  { ...assistantMessage, content: accumulatedAnswer },
                ],
                difyConversationId: serverDifyId || s.difyConversationId,
              };
            }
            return s;
          })
        );
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
    <div className="flex min-h-dvh w-full">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}>
        <ChatSidebarContent
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={startNewChat}
          onSelectSession={loadSession}
          hasMore={hasMoreHistory}
          onLoadMore={handleLoadMore}
        />
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="hidden md:block">
          <Header />
        </div>

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
                <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 inline-block pb-1 mb-4">
                  学内Q&A
                </h1>
                <p className="text-sm text-gray-500">
                  学校生活や授業について、AIが回答します。
                </p>
              </div>

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
                      <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 bg-green-100 border border-green-200">
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
                          {msg.attachments.map((att, i) =>
                            att.type === "image" ? (
                              <div
                                key={i}
                                className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 w-fit cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomedImage(att.url);
                                }}
                              >
                                <Image
                                  src={att.url || "/placeholder.png"}
                                  alt="preview"
                                  width={500}
                                  height={500}
                                  sizes="120px"
                                  className="w-auto h-auto max-w-[120px] max-h-[120px] object-contain"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <a
                                key={i}
                                href="#"
                                onClick={(e) => handleFileClick(e, att.url)}
                                className="block hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-blue-200/50 hover:bg-blue-50 transition-colors w-fit max-w-[200px]">
                                  <div className="w-5 h-5 text-blue-500 shrink-0" />
                                  <span className="font-medium text-gray-700 text-xs truncate">
                                    {att.name}
                                  </span>
                                </div>
                              </a>
                            )
                          )}
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none text-gray-800 wrap-break-word [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
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
                            img: ({ ...props }) => (
                              <span
                                className="inline-block cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setZoomedImage(String(props.src))}
                              >
                                <Image
                                  src={String(props.src)}
                                  alt={props.alt || "image"}
                                  width={500}
                                  height={500}
                                  sizes="240px"
                                  className="w-auto h-auto max-w-60 max-h-60 object-contain rounded-lg border border-gray-200 my-2"
                                  unoptimized
                                />
                              </span>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.role === "assistant" && (
                        <FeedbackButtons
                          messageId={`${currentSessionId || "temp"}-${idx}`}
                          responseContent={msg.content}
                          userPrompt={
                            idx > 0 && messages[idx - 1].role === "user"
                              ? messages[idx - 1].content
                              : ""
                          }
                        />
                      )}
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

              <div className="relative w-full max-w-4xl mx-auto shrink-0 mb-2">
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
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative w-full max-w-5xl h-[85vh]">
            <Image
              src={zoomedImage}
              alt="Zoomed"
              fill
              className="object-contain"
              unoptimized
            />
            <button
              className="absolute -top-4 -right-4 md:top-0 md:right-0 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-50"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}