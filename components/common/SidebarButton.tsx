import React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";

type Props = {
  onClick: () => void;
  isOpen: boolean;
};

const SidebarButton = ({ onClick, isOpen }: Props) => {
  return (
    <button
      onClick={onClick}
      className="p-1 hover:bg-black/5 rounded-md transition-colors focus:outline-none"
      aria-label="Toggle Sidebar"
    >
      <Image
        src={"/hamburgerMenu.png"}
        alt="Menu"
        height={24}
        width={24}
        className={`transition-transform duration-300 ${
          isOpen ? "" : "rotate-180"
        }`}
      />
    </button>
  );
};

export default SidebarButton;
