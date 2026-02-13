import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConfigureAmplify from "@/components/ConfigureAmplify";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taska",
  description:
    "HCSでの「書く」をAIで「助ける」。あなたの学校生活に、頼れるAIアシスタント。",
  icons: {
  icon: "/Taska.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfigureAmplify />
        {children}
      </body>
    </html>
  );
}
