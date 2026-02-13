"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileUp, UserPlus, LayoutDashboard, Trash2 } from "lucide-react";

const AdminSidebarSection = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "ファイルアップロード",
      href: "/admin",
      icon: <FileUp className="w-5 h-5" />,
    },
    {
      name: "利用者登録",
      href: "/admin/register",
      icon: <UserPlus className="w-5 h-5" />,
    },
    {
      name: "利用者一括削除",
      href: "/admin/delete-user",
      icon: <Trash2 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 mb-2 text-gray-700">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-bold">管理メニュー</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                      : "text-gray-700 hover:bg-white/40 hover:text-gray-900"
                  }
                `}
              >
                <span className={isActive ? "text-blue-600" : "text-gray-500"}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebarSection;
