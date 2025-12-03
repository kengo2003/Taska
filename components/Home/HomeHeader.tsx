import React from "react";
import LogoutButton from "./LogoutButton";
import CurrentUserStatus from "./CurrentUserStatus";

const HomeHeader = () => {
  return (
    <div className="h-20 w-full">
      <div className="flex justify-end p-5 gap-5">
        <CurrentUserStatus />
        <LogoutButton />
      </div>
    </div>
  );
};

export default HomeHeader;
