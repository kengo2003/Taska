"use client";

import MenuButton from "./MenuButton";
import { useEffect, useState } from "react";

type Me =
  | {
      loggedIn: true;
      email?: string;
      groups: string[];
    }
  | {
      loggedIn: false;
    };

const HomeMenu = () => {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data: Me = await res.json();
        setMe(data);
      } catch {
        setMe({ loggedIn: false });
      }
    })();
  }, []);

  if (!me) return null;

  if (!me.loggedIn) {
    return <div className="text-sm text-gray-600">未ログイン</div>;
  }

  const isAdmin = me.groups.includes("Admin");

  // レスポンシブ対応: モバイルは1列(grid-cols-1)、PC(md以上)は設定に応じて変更
  const gridColsClass = isAdmin ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-4 px-4 md:px-10`}>
      <MenuButton
        text="履歴書ヘルパー"
        link="/chat"
        className="w-full bg-linear-to-b from-[#394BB6] to-[#192150]"
      />
      <MenuButton
        text="学校Q&A"
        link="/qa"
        className="w-full bg-linear-to-b from-[#2978B2] to-[#12334C]"
      />
      
      {isAdmin && (
        <MenuButton
          text="管理者"
          link="/admin"
          className="w-full bg-linear-to-br from-green-500 to-teal-600 text-white"
        />
      )}
    </div>
  );
};

export default HomeMenu;