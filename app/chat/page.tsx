'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Menu, SquarePen, Upload, X, Send, UserSearch, History, Target, MessageSquare, Trash2, Lightbulb } from 'lucide-react';

// --- 型定義 ---
type Message = {
  role: 'user' | 'assistant';
  content: string;
  attachments?: {
    name: string;
    url: string; 
    type: 'image' | 'file';
  }[];
};

type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
};

// --- ★変更: 自己分析用テンプレート ---
const SELF_ANALYSIS_TEMPLATES = [
  {
    icon: <History className="w-5 h-5 text-purple-500" />,
    label: "過去の振り返り",
    prompt: "過去の経験から「自分の価値観」を見つけたいです。小学生から現在までの「モチベーショングラフ」を作るつもりで、私の過去について質問してください。",
    description: "モチベーションの源泉を探る"
  },
  {
    icon: <Target className="w-5 h-5 text-blue-500" />,
    label: "キャリアの軸探し",
    prompt: "「やりたいこと(Will)」「できること(Can)」「やるべきこと(Must)」のフレームワークを使って、私のキャリアの軸を整理したいです。まずはWillから聞いてください。",
    description: "Will-Can-Mustで整理"
  },
  {
    icon: <UserSearch className="w-5 h-5 text-orange-500" />,
    label: "強みの発掘",
    prompt: "自分の強みがわかりません。客観的な視点で私の長所を見つけたいので、私の性格や普段の行動についてインタビューしてください。",
    description: "客観的に強みを見つける"
  }
];

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
const formatDate = (date: Date) => `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

export default function TaskaPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // ★変更: 初期メッセージを自己分析用に
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'こんにちは！自己分析コーチAIです。まずは自分を知ることから始めましょう。' 
    }
  ]);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- ハンドラ ---

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ role: 'assistant', content: '新しいチャットを開始しました。' }]);
    setSelectedFiles([]);
    setInput('');
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setSelectedFiles([]);
    setInput('');
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('このチャット履歴を削除しますか？')) return;
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const handleTemplateClick = (prompt: string) => {
    // ユーザーに送信させるために入力欄に入れる（即送信も可）
    setInput(prompt);
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    inputElement?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFileClick = async (e: React.MouseEvent, url: string, name: string) => {
    e.preventDefault();
    if (!url) return;
    try {
      if (url.startsWith('http') || url.startsWith('blob:')) {
        window.open(url, '_blank');
        return;
      }
      if (url.startsWith('data:')) {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
             const link = document.createElement('a');
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
    
    let attachmentDataList: Message['attachments'] = [];
    if (filesToSend.length > 0) {
      try {
        const promises = filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: await fileToBase64(file)
        } as const));
        attachmentDataList = await Promise.all(promises);
      } catch (e) { console.error(e); }
    }

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      attachments: attachmentDataList
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSelectedFiles([]);
    setIsLoading(true);

    let targetSessionId = currentSessionId;
    let newSessions = [...sessions];

    if (!targetSessionId) {
      targetSessionId = generateId();
      setCurrentSessionId(targetSessionId);
      const title = messageToSend.trim().substring(0, 20) || '自己分析';
      const newSession: ChatSession = {
        id: targetSessionId,
        title: title,
        date: formatDate(new Date()),
        messages: updatedMessages
      };
      newSessions = [newSession, ...sessions];
    } else {
      const sessionIndex = newSessions.findIndex(s => s.id === targetSessionId);
      if (sessionIndex !== -1) {
        const updatedSession = { ...newSessions[sessionIndex], messages: updatedMessages };
        newSessions.splice(sessionIndex, 1);
        newSessions.unshift(updatedSession);
      }
    }
    setSessions(newSessions);

    try {
      const formData = new FormData();
      formData.append('query', messageToSend);
      formData.append('user', "local-user");
      filesToSend.forEach((file) => formData.append('file', file));

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();
      const assistantMessage: Message = { role: 'assistant', content: data.answer };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      const finalSessions = newSessions.map(s => 
        s.id === targetSessionId ? { ...s, messages: finalMessages } : s
      );
      setSessions(finalSessions);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans">
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-slate-100 to-blue-100 border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-4">
          <button className="p-2 hover:bg-gray-200 rounded-md transition-colors">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="px-4 mb-6">
          <button onClick={startNewChat} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium w-full text-left bg-white p-2 rounded-md shadow-sm border border-gray-200">
            <SquarePen className="w-5 h-5" />
            <span>新しいチャット</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-300 pb-4">
          <div className="text-xs text-gray-400 mb-2 font-medium">チャット履歴</div>
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id} className="group relative">
                <button
                  onClick={() => loadSession(session)}
                  className={`w-full text-left p-2 rounded-md text-sm flex items-start gap-2 transition-all ${
                    currentSessionId === session.id ? 'bg-blue-200 text-blue-900 font-bold' : 'hover:bg-white text-gray-600'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{session.title}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{session.date}</div>
                  </div>
                </button>
                <button onClick={(e) => deleteSession(e, session.id)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-16 flex items-center px-4 md:px-8 border-b border-transparent">
            <div className="flex items-center gap-3">
                <div className="relative w-32 h-10"> 
                  <Image src="/Taska.svg" alt="Taska Logo" fill className="object-contain object-left" priority />
                </div>
            </div>
        </header>

        <div className="flex-1 flex flex-col px-4 md:px-8 pb-4 overflow-hidden">
            <div className="mt-4 mb-6 flex-shrink-0">
                {/* ★変更: タイトルを自己分析に */}
                <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 inline-block pb-1">
                    自己分析チャット
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-3'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0 bg-blue-100 border border-blue-200">
                             <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-bold">T</div>
                          </div>
                        )}
                        <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-[#EBF5FF] text-gray-800 rounded-tr-none' : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tl-none'
                        }`}>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {msg.attachments.map((att, i) => (
                                  <a key={i} href="#" onClick={(e) => handleFileClick(e, att.url, att.name)} className="block hover:opacity-80 transition-opacity cursor-pointer">
                                    {att.type === 'image' ? (
                                      <div className="rounded-lg overflow-hidden border border-gray-200 w-32 h-32 bg-gray-50">
                                        <img src={att.url || '/placeholder.png'} alt="preview" className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-blue-200/50 hover:bg-blue-50 transition-colors w-fit max-w-[200px]">
                                        <div className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <span className="font-medium text-gray-700 text-xs truncate">{att.name}</span>
                                      </div>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* --- ★変更: 自己分析用テンプレートボタン --- */}
                {messages.length === 1 && !isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {SELF_ANALYSIS_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleTemplateClick(template.prompt)}
                        className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group shadow-sm hover:shadow-md"
                      >
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                          {template.icon}
                        </div>
                        <div>
                          <div className="font-bold text-gray-700 text-sm mb-1">{template.label}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start items-center gap-3">
                     <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                     <div className="text-gray-400 text-sm">Taskaが入力中...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="relative w-full max-w-4xl mx-auto flex-shrink-0 mb-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".pdf,.doc,.docx,image/*" />
                
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative bg-white border border-gray-200 rounded-md p-1.5 flex items-center gap-2 shadow-sm pr-7">
                        <div className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{file.name}</span>
                        <button onClick={() => removeFile(index)} className="absolute top-1/2 -translate-y-1/2 right-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative flex items-center group">
                    <div onClick={handleUploadClick} className="absolute left-4 text-gray-400 group-focus-within:text-blue-500 transition-colors cursor-pointer hover:bg-gray-100 p-1 rounded-full">
                        {selectedFiles.length > 0 ? (
                          <div className="relative"><Upload className="w-5 h-5 text-blue-500" /><span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{selectedFiles.length}</span></div>
                        ) : <Upload className="w-5 h-5" />}
                    </div>
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Taskaに相談" disabled={isLoading} className="w-full pl-12 pr-12 py-4 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 bg-white placeholder-gray-400 disabled:bg-gray-50" />
                    <div className="absolute right-4 flex items-center gap-2">
                      {input || selectedFiles.length > 0 ? (
                         <button onClick={handleSend} disabled={isLoading} className="text-blue-600 hover:text-blue-700"><Send className="w-5 h-5" /></button>
                      ) : <button onClick={() => setInput('')} className={`text-gray-400 ${!input && 'hidden'}`}><X className="w-5 h-5" /></button>}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}