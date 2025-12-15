import Image from "next/image";
import HomeMenu from "@/components/Home/HomeMenu";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start pt-32 bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
      <div className="mb-12">
        <Image
          src="/TaskaLogo.png"
          alt="Taska Logo"
          width={350}
          height={150}
          className="object-contain"
          priority
        />
      </div>

      <HomeMenu />
    </main>
  );
}
