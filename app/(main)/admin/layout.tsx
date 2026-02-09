"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/common/Header"; // ヘッダーをインポート
import Sidebar from "@/components/common/Sidebar";
import SidebarButton from "@/components/common/SidebarButton";
import AdminSidebarSection from "@/components/Admin/AdminSidebarSection";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}>
        <AdminSidebarSection />
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
          <span className="text-sm font-bold text-gray-600 mr-2">管理者</span>
        </div>

        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}