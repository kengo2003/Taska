import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/auth/jwt";

const cookieName = process.env.AUTH_COOKIE_NAME || "session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  try {
    const claims = await verifyIdToken(token);
    return NextResponse.json({
      loggedIn: true,
      email: claims.email,
      groups: claims["cognito:groups"] ?? [],
      sub: claims.sub,
    });
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
}
