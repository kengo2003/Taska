"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

type HeaderProps = {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

const Header = ({ isOpen, setIsOpen }: HeaderProps) => {
  return (
    <div className="h-16 bg-linear-to-r from-[#F5F5F5] to-[#94BBD9] flex items-center justify-between px-4 border-b border-gray-200 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          {setIsOpen && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -ml-2 text-gray-700 hover:bg-black/10 rounded-md transition-colors"
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        <Link href={"/"}>
          <Image
            src="/TaskaLogo.png"
            alt="Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      <div className="w-8 h-8" />
    </div>
  );
};

export default Header;
