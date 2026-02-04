import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { 
  DeleteObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectsCommand 
} from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME, fetchJson, saveJson } from "@/lib/s3-db";
import { verifyAccessToken } from "@/lib/auth/jwt"; 
import { ChatSession } from "@/types/type";

export const dynamic = "force-dynamic";

// --- GET: 履歴の詳細取得 ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
      console.error("Token verify error:", e);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const filePath = `users/${userId}/chat/sessions/${id}.json`;
    
    const history = await fetchJson(filePath);

    if (!history) {
      return NextResponse.json({ error: "History not found" }, { status: 404 });
    }

    return NextResponse.json(history);

  } catch (error) {
    console.error("History detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

// --- DELETE: 履歴と関連ファイルの削除 ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. ユーザー認証
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string;
    try {
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
    } catch (e) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 2. アップロードされた関連ファイル (users/{userId}/uploads/{id}/...) の削除
    //    まずリストアップしてから一括削除します
    const uploadPrefix = `users/${userId}/uploads/${id}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: uploadPrefix,
    });
    const listedObjects = await s3.send(listCommand);

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        },
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));
    }

    // 3. 個別セッションファイル (users/{userId}/chat/sessions/{id}.json) の削除
    const sessionKey = `users/${userId}/chat/sessions/${id}.json`;
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: sessionKey,
      }));
    } catch (e) {
      console.warn("Session file delete warning:", e);
      // ファイルがなくても続行（インデックス更新のため）
    }

    // 4. インデックス (users/{userId}/chat/index.json) から該当履歴を除去して更新
    const indexKey = `users/${userId}/chat/index.json`;
    const index = await fetchJson<ChatSession[]>(indexKey) || [];
    const newIndex = index.filter(session => session.id !== id);
    
    // データが減った状態で上書き保存
    await saveJson(indexKey, newIndex);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}