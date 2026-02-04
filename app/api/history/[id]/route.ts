import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchJson } from "@/lib/s3-db";
import { verifyAccessToken } from "@/lib/auth/jwt"; // 認証関数をインポート

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    let userId: string;
    try {
      // トークンを検証してユーザーID (sub) を取得
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
    } catch (e) {
      console.error("Token verify error:", e);
      return Response.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return Response.json({ error: "Session ID is required" }, { status: 400 });
    }

    const filePath = `users/${userId}/chat/sessions/${id}.json`;
    
    const history: any = await fetchJson(filePath);

    if (!history) {
      return Response.json({ error: "History not found" }, { status: 404 });
    }

    return NextResponse.json(history);

  } catch (error) {
    console.error("History detail fetch error:", error);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}