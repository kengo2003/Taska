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
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`
          bg-linear-to-b from-[#F5F5F5] to-[#94BBD9] border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-screen z-50
          
          fixed top-0 left-0 bottom-0 shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-64

          md:translate-x-0 md:shadow-none md:sticky md:top-0
          
          ${isOpen ? "md:w-64" : "md:w-16"}
        `}
      >
        <div className="hidden md:flex h-16 items-center justify-start pl-4 shrink-0">
          <SidebarButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>

        <div className="md:hidden flex h-16 items-center justify-end px-4 border-b border-gray-200/50"></div>

        <div
          className={`flex-1 overflow-hidden transition-all duration-300 ${"opacity-100 visible"} 
          ${isOpen ? "md:opacity-100 md:visible" : "md:opacity-0 md:invisible md:w-0"}
          `}
        >
          <div className="w-64 h-full">{children}</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
