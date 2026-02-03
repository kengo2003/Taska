import { NextResponse } from "next/server";
import { fetchJson } from "@/lib/s3-db";

export const dynamic = 'force-dynamic'; // キャッシュ無効化

export async function GET() {
  try {
    // S3からインデックスファイルを取得。なければ空配列を返す
    const sessions = await fetchJson("chat/index.json") || [];
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}