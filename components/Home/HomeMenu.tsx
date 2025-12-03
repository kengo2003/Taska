import React from "react";
import MenuButton from "./MenuButton";

const HomeMenu = () => {
  return (
    <div className="grid grid-cols-3 gap-4 px-10">
      <MenuButton
        text="履歴書作成"
        link="/"
        className="w-full bg-linear-to-b from-[#394BB6] to-[#192150]"
      />
      <MenuButton
        text="履歴書添削"
        link="/"
        className="w-full bg-linear-to-b from-[#2978B2] to-[#12334C]"
      />
      <MenuButton
        text="FAQ"
        link="/"
        className="w-full bg-linear-to-b from-[#29CEEB] to-[#177585]"
      />
    </div>
  );
};

export default HomeMenu;
