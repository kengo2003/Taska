import React from "react";
import Image from "next/image";

const SidebarButton = () => {
  return (
    <div>
      <Image src={"/hamburgerMenu.png"} alt="Logo" height={20} width={20} className="mb-5"/>
    </div>
  );
};

export default SidebarButton;
