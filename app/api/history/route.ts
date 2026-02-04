import { NextResponse } from "next/server";
import { fetchJson } from "@/lib/s3-db";
import { ChatSession } from "@/types/type";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt"; 

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    let userId: string;

    try {
      const claims = await verifyAccessToken(token);
      
      if (!claims.sub) {
        throw new Error("No sub in token");
      }
      userId = claims.sub;

    } catch (e) {
      console.error("Token verification failed:", e);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const userHistoryPath = `users/${userId}/chat/index.json`;
    
    const sessions = await fetchJson<ChatSession[]>(userHistoryPath) || [];

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(sessions);
    }

    const filteredSessions = sessions.filter(session => {
       return session.type === type;
    });

    return NextResponse.json(filteredSessions);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
