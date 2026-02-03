import { NextResponse } from "next/server";
import { fetchJson } from "@/lib/s3-db";
import { ChatSession } from "@/types/type";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URLから type パラメータを取得 (例: ?type=qa)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // S3から全履歴を取得
    const sessions = await fetchJson<ChatSession[]>("chat/index.json") || [];

    // type指定がない場合は全件返す（互換性維持のため）
    if (!type) {
      return NextResponse.json(sessions);
    }

    const filteredSessions = sessions.filter(session => {
        
        return session.type === type;
    });

    return NextResponse.json(filteredSessions);

  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}