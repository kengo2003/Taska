import Image from "next/image";
import HomeMenu from "@/components/Home/HomeMenu";
import CurrentUserStatus from "@/components/Home/CurrentUserStatus";
import LogoutButton from "@/components/Home/LogoutButton";

export default function Home() {
  return (
    <>
      <div className="flex justify-end items-center gap-3 p-4">
        <CurrentUserStatus />
        <LogoutButton />
      </div>
      <main className="min-h-screen w-full flex flex-col items-center justify-start pt-16 bg-linear-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
        <div className="mb-12">
          <Image
            src="/TaskaLogo.png"
            alt="Taska Logo"
            width={350}
            height={150}
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        <HomeMenu />
      </main>
    </>
  );
}
