import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/auth/jwt";

const cookieName = process.env.AUTH_COOKIE_NAME || "taska_session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  try {
    const claims = await verifyIdToken(token);

    const groups = (claims["cognito:groups"] ?? []) as string[];

    return NextResponse.json(
      {
        loggedIn: true,
        email: claims.email,
        groups,
        sub: claims.sub,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
}
