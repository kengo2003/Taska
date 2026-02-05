"use client";

import React from "react";
import SidebarButton from "./SidebarButton";

type Props = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const Sidebar = ({ children, isOpen, setIsOpen }: Props) => {
  return (
    <>
      {/* 【モバイル用】サイドバーが開いている時の背景オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 h-screen flex flex-col border-r border-gray-200 bg-linear-to-b from-[#F5F5F5] to-[#94BBD9] transition-all duration-300 ease-in-out shrink-0
          
          /* モバイル (md未満): 閉時は画面外、開時は表示 */
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}

          /* PC (md以上): 常に表示、閉時は幅縮小 */
          md:relative md:translate-x-0
          ${isOpen ? "md:w-64" : "md:w-16"}
        `}
      >
        {/* PCでのみ表示する内部トグルボタン */}
        <div
          className={`p-4 hidden md:flex ${isOpen ? "justify-start" : "justify-center"}`}
        >
          <SidebarButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>

        {/* モバイルでサイドバーが開いている時の「閉じる」用ボタン */}
        <div className="md:hidden p-4 flex justify-end">
           <SidebarButton onClick={() => setIsOpen(false)} isOpen={true} />
        </div>

        {/* コンテンツエリア: 閉じている時は完全に隠す */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-200
            ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
          `}
        >
          {children}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;