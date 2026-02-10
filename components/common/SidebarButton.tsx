import Image from "next/image";
import { RxHamburgerMenu } from "react-icons/rx";

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
      <RxHamburgerMenu
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
