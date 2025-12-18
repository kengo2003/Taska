"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  Wifi,
  Upload,
  Send,
} from "lucide-react";

import Header from "@/components/common/Header";
import ChatSidebar from "@/components/Chat/Sidebar";
import { ChatSession } from "@/types/type";

// FAQデータ
interface FAQItem {
  category: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  { 
    category: "履修・授業", 
    icon: <BookOpen className="w-4 h-4" />, 
    question: "履修登録の修正期間はありますか？", 
    answer: "はい、例年登録期間終了後の3日間が修正期間として設けられます。" 
  },
  { 
    category: "学生生活", 
    icon: <HelpCircle className="w-4 h-4" />, 
    question: "学生証を紛失した場合はどうすればいいですか？", 
    answer: "速やかに学生課窓口へ届け出てください。再発行には手数料1,000円と写真1枚が必要になります。" 
  },
  { 
    category: "IT・システム", 
    icon: <Wifi className="w-4 h-4" />, 
    question: "学内Wi-Fiのパスワードを忘れました。", 
    answer: "ポータルサイトのマイページから確認、またはリセットが可能です。" 
  },
];

// メッセージの型定義
type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; url: string; type: "image" | "file" }[];
};

export default function QABase() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // サイドバー管理用
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setInput("");
    setMessages([]);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？")) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 150;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("query", userMessage.content);
      formData.append("user", "local-user-qa");

      const res = await fetch("/api/qa", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: Message = { role: "assistant", content: data.answer };
      
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "エラーが発生しました。" }]);
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

  const filteredFaq = faqData.filter(item =>
    item.question.includes(searchQuery) || item.answer.includes(searchQuery)
  );

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

        <main className="flex-1 flex overflow-hidden relative bg-white border-t border-gray-200">
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            <div className="flex-1 flex flex-col px-4 md:px-8 pb-4 overflow-hidden">
              
              <div className="mt-4 mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 inline-block pb-1 mb-4">
                  学内Q&A
                </h1>
                <p className="text-sm text-gray-500">
                  学校生活や授業に関する質問はこちらで検索、またはAIに相談できます。
                </p>
              </div>

              {messages.length > 0 ? (
                <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                       {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">A</div>
                       )}
                       <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                         msg.role === 'user' ? 'bg-[#EBF5FF] text-gray-800' : 'bg-gray-50 border border-gray-200'
                       }`}>
                         {msg.content}
                       </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start items-center gap-3">
                       <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                       <div className="text-gray-400 text-sm">回答を作成中...</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative w-full max-w-2xl shrink-0 mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Q&A内を検索..."
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredFaq.map((item, index) => (
                      <div key={index} className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                        <button
                          className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase">
                              {item.icon} {item.category}
                            </div>
                            <span className="text-lg font-bold text-gray-800">{item.question}</span>
                          </div>
                          {openIndex === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>
                        {openIndex === index && (
                          <div className="px-5 pb-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-[#F8FAFC] p-5 rounded-xl text-gray-800 leading-relaxed border-l-4 border-blue-400 text-sm">
                              {item.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="relative w-full max-w-4xl mx-auto shrink-0 mb-2">
                <div className="relative flex items-end group">
                  <div className="absolute left-4 bottom-4 text-gray-400 hover:bg-gray-100 p-1 rounded-full cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="解決しない場合はTaskaに相談"
                    rows={1}
                    className="w-full pl-12 pr-12 py-4 rounded-[28px] border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 bg-white placeholder-gray-400 resize-none overflow-hidden min-h-14 leading-relaxed"
                  />

                  <div className="absolute right-4 bottom-4">
                    <button 
                      onClick={handleSend}
                      className={`transition-colors ${input ? "text-blue-600 hover:text-blue-700" : "text-gray-300 cursor-not-allowed"}`}
                      disabled={!input || isLoading}
                    >
                      <Send className="w-5 h-5" />
                    </button>
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