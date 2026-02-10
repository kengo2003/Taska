"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdOutlineLogout } from "react-icons/md";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} aria-label="logout">
      <MdOutlineLogout
        width={40}
        height={40}
        className="w-6 h-6 cursor-pointer hover:opacity-70"
      />
    </button>
  );
};

export default LogoutButton;
