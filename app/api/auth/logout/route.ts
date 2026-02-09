import { NextResponse } from "next/server";

const sessionCookie = process.env.AUTH_COOKIE_NAME || "taska_session";
const accessCookie = process.env.AUTH_ACCESS_COOKIE_NAME || "taska_access";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set(sessionCookie, "", {
    path: "/",
    maxAge: 0,
  });

  res.cookies.set(accessCookie, "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}
