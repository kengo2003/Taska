import { NextResponse } from "next/server";

const cookieName = process.env.AUTH_COOKIE_NAME || "taska_session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return res;
}
