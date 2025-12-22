"use client";

import React, { useState } from "react";
import SidebarButton from "./SidebarButton";

type Props = {
  children: React.ReactNode;
};

const Sidebar = ({ children }: Props) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-16"
      } bg-linear-to-b from-[#F5F5F5] to-[#94BBD9] border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 h-screen`}
    >
      <div
        className={`p-4 flex ${isOpen ? "justify-start" : "justify-center"}`}
      >
        <SidebarButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      </div>

      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible w-0 h-0"
        }`}
      >
        {children}
      </div>
    </aside>
  );
};

export default Sidebar;
