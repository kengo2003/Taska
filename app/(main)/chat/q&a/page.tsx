"use client";

import React, { useState } from 'react';
import Title from "@/components/common/Title"; // 他のページで使われている共通タイトル
import { ChevronDown, ChevronUp, Search, MessageCircle } from "lucide-react"; // アイコンの追加

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  { category: "履修", question: "履修登録の方法を教えてください", answer: "学内ポータルサイトにログインし、「履修登録」メニューから期間内に申請してください。不明点は教務課窓口でも受け付けています。" },
  { category: "生活", question: "学生証を紛失したのですが、どうすればいいですか？", answer: "学生課窓口で再発行の手続きが必要です。写真1枚と再発行手数料（1,000円）が必要になります。" },
  { category: "IT", question: "学内のWi-Fiに接続するには？", answer: "SSID「HCS-WiFi」を選択し、学内アカウントのIDとパスワードで認証を行ってください。" },
  { category: "証明書", question: "学割証（学校学生生徒旅客運賃割引証）の発行方法は？", answer: "1Fロビーにある証明書自動発行機にて、学生証を使って発行してください。発行手数料は無料です。" },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 検索フィルタリング
  const filteredFaq = faqData.filter(item => 
    item.question.includes(searchQuery) || item.answer.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 共通のタイトルコンポーネント */}
      <Title text="学内Q&A" />

      <p className="text-muted-foreground -mt-4">
        学校生活での困りごとや、手続きに関するよくある質問をまとめています。
      </p>

      {/* 検索バー - 管理画面などの入力フォームのスタイルを意識 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="キーワードで検索..."
          className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-3 max-w-4xl">
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item, index) => (
            <div key={index} className="border border-border rounded-xl overflow-hidden bg-card transition-all">
              <button
                type="button"
                className="w-full flex justify-between items-center p-4 text-left font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{item.category}</span>
                  <span className="text-foreground">{item.question}</span>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="p-4 bg-muted/30 text-muted-foreground border-t border-border animate-in fade-in slide-in-from-top-1">
                  <p className="leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            該当する質問が見つかりませんでした。
          </div>
        )}
      </div>

      {/* 下部のヘルプセクション - Taskaのブランドカラーを意識 */}
      <div className="mt-8 p-6 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 rounded-full text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100">解決しませんか？</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              AIアシスタントに直接質問するか、各学科の担当教員・窓口へお問い合わせください。
            </p>
            <button className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-shadow shadow-sm shadow-blue-200">
              AIチャットを開く
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}