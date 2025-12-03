import React from "react";
import Image from "next/image";
import Link from "next/link";

const LogoutButton = () => {
  return (
    <>
      <Link href={"/"}>
        <Image alt="logout" src={"/Logout.png"} width={40} height={40} />
      </Link>
    </>
  );
};

export default LogoutButton;
