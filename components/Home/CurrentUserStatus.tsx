"use client";

import { useEffect, useState } from "react";

type Me =
  | {
      loggedIn: true;
      email?: string;
      groups: string[];
    }
  | {
      loggedIn: false;
    };

const CurrentUserStatus = () => {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data: Me = await res.json();
        setMe(data);
      } catch {
        setMe({ loggedIn: false });
      }
    })();
  }, []);

  if (!me) return null;

  if (!me.loggedIn) {
    return <div className="text-sm text-gray-600">未ログイン</div>;
  }

  const isAdmin = me.groups.includes("Admin");

  return (
    <div className="text-right text-sm">
      <p className="text-gray-500">ログイン中のユーザ</p>

      <div className="flex justify-end gap-2 font-medium">
        <span>{isAdmin ? "管理者" : "ユーザ"}</span>
        <span>{me.email ?? "unknown"}</span>
      </div>
    </div>
  );
};

export default CurrentUserStatus;
