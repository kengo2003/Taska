"use client";

import React from "react";
import SidebarButton from "./SidebarButton";

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
};

const Sidebar = ({ isOpen, setIsOpen, children }: Props) => {
  return (
    <>
      {/* ▼▼▼ モバイル用オーバーレイ (背景の黒味) ▼▼▼ */}
      {/* モバイル(md未満)で、isOpenがtrueの時だけ表示 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)} // 背景クリックで閉じる
      />

      {/* ▼▼▼ サイドバー本体 ▼▼▼ */}
      <aside
        className={`
          /* 共通設定 */
          bg-gradient-to-b from-[#F5F5F5] to-[#94BBD9] border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-screen z-50
          
          /* モバイル設定 (fixedで浮遊) */
          fixed top-0 left-0 bottom-0 shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-64

          /* PC設定 (md以上で sticky/relative に戻す) */
          md:translate-x-0 md:static md:shadow-none md:sticky md:top-0
          md:${isOpen ? "w-64" : "w-16"}
        `}
      >
        {/* PC用ハンバーガーボタン (モバイルでは非表示) */}
        <div className="hidden md:flex h-16 items-center justify-start pl-4 shrink-0">
          <SidebarButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>

        {/* モバイル用閉じるボタン (必要ならヘッダーと同じ高さに配置) */}
        <div className="md:hidden flex h-16 items-center justify-end px-4 border-b border-gray-200/50">
           {/* モバイルでサイドバー内のボタンから閉じたければここに追加 */}
        </div>

        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-200 ${
            // モバイルなら常に中身表示、PCなら開閉に合わせてフェード
            "opacity-100 visible"
          } md:${isOpen ? "opacity-100 visible" : "opacity-0 invisible w-0"}`}
        >
          {/* 中身 */}
          <div className="block">
            {children}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;