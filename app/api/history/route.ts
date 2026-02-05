import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchJson } from "@/lib/s3-db";
import { ChatSession } from "@/types/type";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. ユーザー認証
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    let userId: string;
    try {
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
    } catch (e) {
      console.error("Token verification failed:", e);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    const userHistoryPath = `users/${userId}/chat/index.json`;
    const sessions = await fetchJson<ChatSession[]>(userHistoryPath) || [];

    let resultSessions = sessions;

    if (type) {
      resultSessions = resultSessions.filter(session => session.type === type);
    }

    const limitedSessions = resultSessions.slice(0, limit);

    return NextResponse.json(limitedSessions);

  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}