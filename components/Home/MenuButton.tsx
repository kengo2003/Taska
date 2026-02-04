import { Button } from "../ui/button";
import Link from "next/link";
import { MenuButtonProps } from "@/types/type";

const MenuButton = ({ text, link, className }: MenuButtonProps) => {
  return (
    <div>
      <Button
        className={`bg-amber-600 px-6 py-12 text-3xl ${className}`}
        asChild
      >
        <Link href={link}>{text}</Link>
      </Button>
    </div>
  );
};

export default MenuButton;
