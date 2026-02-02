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

  // 管理者かどうかでグリッドの列数を切り替える
  // 管理者なら3列、それ以外なら2列にしてバランスをとる
  const gridColsClass = isAdmin ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={`grid ${gridColsClass} gap-4 px-10`}>
      <MenuButton
        text="履歴書ヘルパー"
        link="/chat"
        className="w-full bg-linear-to-b from-[#394BB6] to-[#192150]"
      />
      <MenuButton
        text="学校Q&A"
        link="/q&a"
        className="w-full bg-linear-to-b from-[#2978B2] to-[#12334C]"
      />
      
      {/* 管理者の場合のみDOMに描画する（空のタグも出力しない） */}
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