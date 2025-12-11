import React from "react";
import SidebarButton from "./SidebarButton";
import AdminSidebarSection from "../Admin/AdminSidebarSection";

const Sidebar = () => {
  return (
    <div className="bg-linear-to-b from-[#F5F5F5] to-[#94BBD9] w-54 p-5">
      <SidebarButton />
      <AdminSidebarSection />
    </div>
  );
};

export default Sidebar;
