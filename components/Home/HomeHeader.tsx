import Image from "next/image";

const HomeHeader = () => {
  return (
    <header className="h-20 flex items-center justify-center border-b border-gray-50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="relative w-40 h-12">
        <Image
          src="/TaskaLogo.png"
          alt="Taska Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </header>
  );
};

export default HomeHeader;
