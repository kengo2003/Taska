import React from "react";
import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import AdminSidebarSection from "@/components/Admin/AdminSidebarSection";

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <div className="p-2">
          <AdminSidebarSection />
        </div>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
};

export default layout;
