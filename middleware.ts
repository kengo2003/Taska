// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth/jwt";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "taska_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ログイン不要ページ
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const claims = await verifyIdToken(token);
    const groups = (claims["cognito:groups"] ?? []) as string[];

    // 管理画面だけ管理者チェック
    if (pathname.startsWith("/admin") && !groups.includes("Admins")) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
