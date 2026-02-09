import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchJson } from "@/lib/s3-db";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ChatSession } from "@/types/type";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // ----------------------------------------------------------------
    // 1. ユーザー認証
    // ----------------------------------------------------------------
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ----------------------------------------------------------------
    // 2. パラメータ取得 (limit, type)
    // ----------------------------------------------------------------
    const { searchParams } = new URL(request.url);
    // limitがない場合はデフォルト5件、あれば数値に変換
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    
    // type (resume | qa) でフィルタリングする場合
    const type = searchParams.get("type");

    // ----------------------------------------------------------------
    // 3. 履歴データの取得とフィルタリング
    // ----------------------------------------------------------------
    const indexFilePath = `users/${userId}/chat/index.json`;
    const historyIndex = (await fetchJson<ChatSession[]>(indexFilePath)) || [];

    // タイプによるフィルタリング (type指定がある場合のみ)
    let filteredHistory = historyIndex;
    if (type) {
      filteredHistory = historyIndex.filter((session) => session.type === type);
    }

    // ★重要: 指定された件数(limit)だけ切り出す
    const limitedHistory = filteredHistory.slice(0, limit);

    return NextResponse.json(limitedHistory);

  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}