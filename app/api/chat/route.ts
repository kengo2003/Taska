import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME, fetchJson, saveJson } from "@/lib/s3-db";
import { verifyAccessToken } from "@/lib/auth/jwt";
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
    // 1. ユーザー認証 & メアド取得
    // ----------------------------------------------------------------
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    let userId: string;
    let userEmail: string = "";

    try {
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
      userEmail = (claims.email as string) || "unknown";
      
      console.log(`[Chat] Auth Success - User: ${userEmail} (ID: ${userId})`);
    } catch (e) {
      console.error("Token verification failed:", e);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // ----------------------------------------------------------------
    // 2. リクエストデータの取得
    // ----------------------------------------------------------------
    const formData = await request.formData();
    const query = formData.get("query") as string;
    let conversationId = formData.get("conversation_id") as string;
    const incomingDifyConversationId = formData.get("dify_conversation_id") as string;
    const files = formData.getAll("file") as File[];
    const inputsString = formData.get("inputs") as string;

    const apiKey = process.env.DIFY_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "");

    if (!apiKey || !apiUrl) {
      console.error("[Chat] Config Error: API Key or URL missing");
      return NextResponse.json({ error: "Config Error" }, { status: 500 });
    }

    const isNewSession = !conversationId || conversationId === "null" || conversationId === "";
    
    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
      console.log(`[Chat] New Session Created: ${conversationId} by ${userEmail}`);
    } else {
      console.log(`[Chat] Existing Session: ${conversationId} by ${userEmail}`);
    }

    // ----------------------------------------------------------------
    // 3. ファイル処理
    // ----------------------------------------------------------------
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      console.log(`[Chat] Processing ${files.length} files for ${userEmail}`);
      for (const file of files) {
        if (file.size === 0) continue;
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `users/${userId}/uploads/${conversationId}/${Date.now()}_${file.name}`;
          await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey, Body: buffer, ContentType: file.type }));
          
          localAttachments.push({
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "file",
            url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
          });

          // Dify Upload
          const uploadFormData = new FormData();
          const blob = new Blob([buffer], { type: file.type });
          uploadFormData.append("file", blob, file.name);
          uploadFormData.append("user", userId);

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
        } catch(e) { console.error(`[Chat] File Error for ${userEmail}:`, e); }
      }
    }

    // ----------------------------------------------------------------
    // 4. Difyへ送信
    // ----------------------------------------------------------------
    let inputs: Record<string, unknown> = {};
    try {
      if (inputsString) inputs = JSON.parse(inputsString);
    } catch (e) { console.warn("Failed to parse inputs JSON:", e); }
    if (difyFiles.length > 0) inputs["doc"] = difyFiles;

    const chatPayload: ChatPayload = {
      inputs: inputs,
      query: query,
      response_mode: "blocking",
      user: userId,
      conversation_id: incomingDifyConversationId || undefined,
      files: difyFiles.length > 0 ? difyFiles : undefined
    };

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error(`[Chat] Dify API Error for ${userEmail}: ${chatRes.status} ${errText}`);
      throw new Error(`Dify API Error: ${chatRes.status}`);
    }

    const data = (await chatRes.json()) as any;
    const newDifyConversationId = data.conversation_id;

    // ----------------------------------------------------------------
    // 5. S3へ履歴保存
    // ----------------------------------------------------------------
    const sessionFilePath = `users/${userId}/chat/sessions/${conversationId}.json`;
    const indexFilePath = `users/${userId}/chat/index.json`;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // A. 詳細データの保存
    let sessionData: { messages: Message[]; email?: string } = { messages: [] };
    if (!isNewSession) {
      const existing = await fetchJson<{ messages: Message[]; email?: string }>(sessionFilePath);
      if (existing) sessionData = existing;
    }

    sessionData.messages.push({
      role: "user",
      content: query,
      attachments: localAttachments,
      date: formattedDate
    });
    sessionData.messages.push({
      role: "assistant",
      content: data.answer,
      attachments: [],
      date: formattedDate
    });

    await saveJson(sessionFilePath, {
      messages: sessionData.messages,
      difyConversationId: newDifyConversationId,
      id: conversationId,
      type: "resume",
      email: userEmail,
    });
    console.log(`[Chat] Session saved: ${sessionFilePath} (User: ${userEmail})`);

    // B. インデックス(一覧)の更新
    const index = (await fetchJson<ChatSession[]>(indexFilePath)) || [];
    
    if (isNewSession) {
      index.unshift({
        id: conversationId,
        title: query.substring(0, 20) || "新しいチャット",
        date: formattedDate,
        email: userEmail,
        messages: [],
        difyConversationId: newDifyConversationId,
        type: "resume",
      });
    } else {
      const targetIndex = index.findIndex(s => s.id === conversationId);
      if (targetIndex > -1) {
        const target = index[targetIndex];
        index.splice(targetIndex, 1);
        index.unshift({
          ...target,
          date: formattedDate,
          email: userEmail,
          difyConversationId: newDifyConversationId
        });
      }
    }
    await saveJson(indexFilePath, index);
    console.log(`[Chat] Index updated for ${userEmail}`);

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,
      dify_conversation_id: newDifyConversationId,
    });

  } catch (error: unknown) {
    console.error("[Chat] Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}