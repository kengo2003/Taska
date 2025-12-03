import Image from "next/image";
import HomeMenu from "@/components/Home/HomeMenu";
import HomeHeader from "@/components/Home/HomeHeader";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-[#FFFFFF] via-[#94BBD9] to-[#2978B2]">
      <HomeHeader />
      <Image
        src="/TaskaLogo.png"
        alt="Logo"
        width={350}
        height={200}
        className="mx-auto mb-16"
      />
      <HomeMenu />
    </main>
  );
}
