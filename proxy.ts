import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "taska_session";

export async function proxy(req: NextRequest) { 
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/login",                
    "/api/auth/forgot-password", 
    "/TaskaLogo.png",        
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const claims = await verifyAccessToken(token);
    const groups = (claims["cognito:groups"] ?? []) as string[];

    if (pathname.startsWith("/admin") && !groups.includes("Admin")) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy Auth Error:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};