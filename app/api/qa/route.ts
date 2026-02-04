import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // 追加
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME, fetchJson, saveJson } from "@/lib/s3-db";
import { verifyAccessToken } from "@/lib/auth/jwt"; // ★追加: 認証用
import {
  ChatSession,
  Message,
  DifyFile,
  UploadResponse,
  ChatPayload,
  LocalAttachment,
} from "@/types/type";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // ----------------------------------------------------------------
    // 1. ユーザー認証 (Security)
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // 2. リクエスト処理
    // ----------------------------------------------------------------
    const formData = await request.formData();
    const query = formData.get("query") as string;
    // const user = (formData.get("user") as string) || "qa-user"; // 廃止: userIdを使用

    let conversationId = formData.get("conversation_id") as string;
    const incomingDifyConversationId = formData.get(
      "dify_conversation_id",
    ) as string;
    const files = formData.getAll("file") as File[];

    const apiKey = process.env.DIFY_QA_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "");

    if (!apiKey || !apiUrl) {
      console.error(
        "Config Error: DIFY_QA_API_KEY or DIFY_API_URL is missing.",
      );
      return NextResponse.json({ error: "Config Error" }, { status: 500 });
    }

    // ID確定
    const isNewSession =
      !conversationId || conversationId === "null" || conversationId === "";
    
    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
      console.log(`[QA] New Session Created: ${conversationId}`);
    } else {
      console.log(`[QA] Existing Session: ${conversationId}`);
    }

    // ----------------------------------------------------------------
    // 3. ファイル処理 (ユーザー隔離パスへ)
    // ----------------------------------------------------------------
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;

        // S3アップロード
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          // 変更: ユーザーごとのフォルダへ
          const fileKey = `users/${userId}/uploads/${conversationId}/${Date.now()}_${file.name}`;
          
          await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: fileKey,
              Body: buffer,
              ContentType: file.type,
            }),
          );
          
          const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
          
          localAttachments.push({
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "file",
            url: s3Url,
          });
          console.log(`[QA] File uploaded to S3: ${fileKey}`);

          // Difyアップロード
          const uploadFormData = new FormData();
          // DifyにはBlobとして渡す必要がある場合があるため変換
          const blob = new Blob([buffer], { type: file.type });
          uploadFormData.append("file", blob, file.name);
          uploadFormData.append("user", userId); // ★認証済みIDを使用

          const uploadRes = await fetch(`${apiUrl}/files/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: uploadFormData,
          });

          if (uploadRes.ok) {
            const uploadData = (await uploadRes.json()) as UploadResponse;
            difyFiles.push({
              type: file.type.startsWith("image/") ? "image" : "document",
              transfer_method: "local_file",
              upload_file_id: uploadData.id,
            });
          }
        } catch (e) {
          console.error("[QA] File Processing Error:", e);
        }
      }
    }

    // ----------------------------------------------------------------
    // 4. Difyへ送信
    // ----------------------------------------------------------------
    const chatPayload: ChatPayload = {
      inputs: {},
      query: query || "",
      response_mode: "blocking",
      user: userId, // ★認証済みIDを使用
    };
    if (incomingDifyConversationId)
      chatPayload.conversation_id = incomingDifyConversationId;
    if (difyFiles.length > 0) chatPayload.files = difyFiles;

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      console.error(`Dify Chat Error: ${chatRes.status}`);
      return NextResponse.json(
        { error: await chatRes.text() },
        { status: chatRes.status },
      );
    }

    const data = (await chatRes.json()) as any;
    const newDifyConversationId = data.conversation_id;

    // ----------------------------------------------------------------
    // 5. S3へ履歴保存 (ユーザー隔離パスへ)
    // ----------------------------------------------------------------
    console.log("[QA] Saving history to S3...");

    // パス定義 (自分専用のパス)
    const sessionFilePath = `users/${userId}/chat/sessions/${conversationId}.json`;
    const indexFilePath = `users/${userId}/chat/index.json`;

    let sessionData: { messages: Message[] } = { messages: [] };
    if (!isNewSession) {
      const existing = await fetchJson<{ messages: Message[] }>(sessionFilePath);
      if (existing) sessionData = existing;
    }

    sessionData.messages.push({
      role: "user",
      content: query,
      attachments: localAttachments,
    });
    sessionData.messages.push({
      role: "assistant",
      content: data.answer,
      attachments: [],
    });

    // セッション保存
    await saveJson(sessionFilePath, {
      messages: sessionData.messages,
      difyConversationId: newDifyConversationId,
      type: "qa",
      id: conversationId // IDも含める
    });
    console.log(`[QA] Session saved: ${sessionFilePath}`);

    // 一覧更新
    // 既存の履歴一覧を取得 (自分専用)
    let index = (await fetchJson<ChatSession[]>(indexFilePath)) || [];
    
    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    if (isNewSession) {
      // 新規追加
      const newSessionSummary: ChatSession = {
        id: conversationId,
        title: query.substring(0, 20) || "QAチャット",
        date: formattedDate,
        messages: [],
        difyConversationId: newDifyConversationId,
        type: "qa",
      };
      index = [newSessionSummary, ...index];
    } else {
      // 既存更新（先頭へ移動）
      const targetIndex = index.findIndex(s => s.id === conversationId);
      if (targetIndex > -1) {
        const target = index[targetIndex];
        index.splice(targetIndex, 1);
        index.unshift({
          ...target,
          date: formattedDate,
          difyConversationId: newDifyConversationId
        });
      }
    }
    
    // インデックス保存
    await saveJson(indexFilePath, index);
    console.log(`[QA] Index updated: ${indexFilePath}`);

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,
      dify_conversation_id: newDifyConversationId,
    });
  } catch (error: unknown) {
    console.error("[QA] Server Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 },
    );
  }
}