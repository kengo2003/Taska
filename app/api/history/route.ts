import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchJson } from "@/lib/s3-db";
import { verifyIdToken } from "@/lib/auth/jwt";
import { ChatSession } from "@/types/type";
import { getCurrentJSTTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      process.env.AUTH_COOKIE_NAME || "taska_session",
    )?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const claims = await verifyIdToken(token);
      userId = claims.sub as string;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const type = searchParams.get("type");

    const indexFilePath = `users/${userId}/chat/index.json`;
    const historyIndex = (await fetchJson<ChatSession[]>(indexFilePath)) || [];

    const filteredHistory = type
      ? historyIndex.filter((session) => session.type === type)
      : historyIndex;

    const limitedHistory = filteredHistory.slice(0, limit);

    const formattedHistory = limitedHistory.map((session) => ({
      ...session,
      date: getCurrentJSTTime(session.date),
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
