import React from "react";
import MenuButton from "./MenuButton";

const HomeMenu = () => {
  return (
    <div className="grid grid-cols-3 gap-4 px-10">
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
      {/* <MenuButton
        text="FAQ"
        link="/chat"
        className="w-full bg-linear-to-b from-[#29CEEB] to-[#177585]"
      /> */}
      <MenuButton
        text="管理者"
        link="/admin"
        className="w-full bg-linear-to-br from-green-500 to-teal-600 text-white"
      />
    </div>
  );
};

export default HomeMenu;
