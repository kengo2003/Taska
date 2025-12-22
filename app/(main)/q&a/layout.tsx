import React from "react";

export default function FAQLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // page.tsx側でSidebarとHeaderを管理するため、ここでは何もラップしない
  return <>{children}</>;
}