import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <div className="bg-linear-to-r from-[#F5F5F5] to-[#94BBD9]">
      <Link href={"/"}>
        <Image
          src="/TaskaLogo.png"
          alt="Logo"
          width={150}
          height={100}
          className="p-3"
          unoptimized
        />
      </Link>
    </div>
  );
};

export default Header;
