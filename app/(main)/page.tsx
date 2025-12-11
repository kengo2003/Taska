import Image from "next/image";
import HomeMenu from "@/components/Home/HomeMenu";

export default function Home() {
  return (
    // justify-center を justify-start に変更し、pt-32 (上部余白) を追加
    <main className="min-h-screen w-full flex flex-col items-center justify-start pt-32 bg-gradient-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
      
      {/* ロゴ画像 */}
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

      {/* メニューコンポーネント (ボタンサイズは維持) */}
      <HomeMenu />
    </main>
  );
}