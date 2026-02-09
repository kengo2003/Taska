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
      {/* モバイル用オーバーレイ */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* サイドバー本体 */}
      <aside
        className={`
          /* 共通設定 */
          bg-gradient-to-b from-[#F5F5F5] to-[#94BBD9] border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-screen z-50
          
          /* モバイル設定 */
          fixed top-0 left-0 bottom-0 shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-64

          /* PC設定 */
          md:translate-x-0 md:static md:shadow-none md:sticky md:top-0
          /* 幅の切り替え */
          md:${isOpen ? "w-64" : "w-16"}
        `}
      >
        {/* ハンバーガーボタンエリア */}
        {/* ★修正: hidden md:flex を追加し、モバイル版では非表示にする */ }
        <div className="hidden md:flex h-16 items-center justify-start pl-4 shrink-0">
          <SidebarButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>

        {/* コンテンツエリア */}
        <div
          className={`flex-1 overflow-hidden transition-all duration-300 ${
            isOpen
              ? "opacity-100 visible"
              : "md:opacity-0 md:invisible md:w-0 opacity-100 visible"
          }`}
        >
          {/* 中身の幅を固定して崩れを防ぐ */}
          <div className="w-64 h-full">
            {children}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;