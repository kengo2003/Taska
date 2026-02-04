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

// 常に最新データを取得するために動的レンダリングを強制
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
      // トークンを検証してユーザーIDを取得
      const claims = await verifyAccessToken(token);
      userId = claims.sub as string;
    } catch (e) {
      console.error("Token verification failed:", e);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // ----------------------------------------------------------------
    // 2. リクエストデータの取得
    // ----------------------------------------------------------------
    const formData = await request.formData();
    const query = formData.get("query") as string;
    // const user = formData.get("user") as string; // フロントからのuser IDは信用せず、トークンのuserIdを使う

    // アプリ管理用のID (S3保存時のファイル名)
    let conversationId = formData.get("conversation_id") as string;

    // Dify管理用のID (AIの文脈維持用)
    const incomingDifyConversationId = formData.get(
      "dify_conversation_id",
    ) as string;

    const files = formData.getAll("file") as File[];
    const inputsString = formData.get("inputs") as string;

    const apiKey = process.env.DIFY_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "");

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "Config Error: API Key or URL missing" },
        { status: 500 },
      );
    }

    // セッションIDの確定 (アプリ用)
    const isNewSession =
      !conversationId || conversationId === "null" || conversationId === "";
    
    if (isNewSession) {
      // ランダムID生成 (UUIDライブラリがあるなら uuidv4() 推奨ですが、既存に合わせています)
      conversationId = Math.random().toString(36).substring(2, 10);
    }

    // ----------------------------------------------------------------
    // 3. ファイル処理 (S3 & Dify) - ユーザー隔離パスへ
    // ----------------------------------------------------------------
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;

        // S3アップロード: パスをユーザーごとに分ける
        const buffer = Buffer.from(await file.arrayBuffer());
        // 変更前: `chat/uploads/${conversationId}/...`
        // 変更後: `users/${userId}/uploads/${conversationId}/...`
        const fileKey = `users/${userId}/uploads/${conversationId}/${Date.now()}_${file.name}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
            // ACL: "public-read", // ★パブリックアクセスブロック時はACL設定不要(またはエラーになる)なので削除
          }),
        );

        // バケットが非公開の場合、このURLは直接開けません。
        // フロントエンドで表示する際は、別途署名付きURLを取得する仕組みが必要です。
        // 一旦、キー情報をURLとして保持、あるいはS3のパス構造を保持します。
        const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

        localAttachments.push({
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "file",
          url: s3Url, 
        });

        // Difyアップロード
        const uploadFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        uploadFormData.append("file", blob, file.name);
        uploadFormData.append("user", userId); // ★認証済みのuserIdを使用

        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          console.error(`Dify File Upload Failed:`, await uploadRes.text());
          continue;
        }

        const uploadData = (await uploadRes.json()) as UploadResponse;
        difyFiles.push({
          type: file.type.startsWith("image/") ? "image" : "document",
          transfer_method: "local_file",
          upload_file_id: uploadData.id,
        });
      }
    }

    // ----------------------------------------------------------------
    // 4. Difyへチャット送信
    // ----------------------------------------------------------------
    let inputs: Record<string, unknown> = {};
    try {
      if (inputsString) {
        inputs = JSON.parse(inputsString);
      }
    } catch (e) {
      console.warn("Failed to parse inputs JSON:", e);
    }

    if (difyFiles.length > 0) {
      inputs["doc"] = difyFiles;
    }

    const chatPayload: ChatPayload = {
      inputs: inputs,
      query: query,
      response_mode: "blocking",
      user: userId, // ★認証済みのuserIdを使用
    };

    if (incomingDifyConversationId) {
      chatPayload.conversation_id = incomingDifyConversationId;
    }

    if (difyFiles.length > 0) {
      chatPayload.files = difyFiles;
    }

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      throw new Error(
        `Dify API Error: ${chatRes.status} ${await chatRes.text()}`,
      );
    }

    const data = (await chatRes.json()) as any;
    const newDifyConversationId = data.conversation_id;

    // ----------------------------------------------------------------
    // 5. S3へ履歴保存 (Data Persistence) - ユーザー隔離パスへ
    // ----------------------------------------------------------------
    
    // パス定義
    // 変更後: `users/${userId}/chat/sessions/${conversationId}.json`
    const sessionFilePath = `users/${userId}/chat/sessions/${conversationId}.json`;
    // 変更後: `users/${userId}/chat/index.json`
    const indexFilePath = `users/${userId}/chat/index.json`;

    // A. セッション詳細の保存
    let sessionData: { messages: Message[] } = { messages: [] };
    if (!isNewSession) {
      const existing = await fetchJson<{ messages: Message[] }>(sessionFilePath);
      if (existing) sessionData = existing;
    }

    // メッセージ追加
    const userMessage: Message = {
      role: "user",
      content: query,
      attachments: localAttachments,
    };
    sessionData.messages.push(userMessage);

    const assistantMessage: Message = {
      role: "assistant",
      content: data.answer,
      attachments: [],
    };
    sessionData.messages.push(assistantMessage);

    // 詳細JSON保存
    await saveJson(sessionFilePath, {
      messages: sessionData.messages,
      difyConversationId: newDifyConversationId,
      id: conversationId, // IDも含めておくと便利
    });

    // B. インデックス(一覧)の更新
    // 既存のインデックスを取得 (自分専用のファイル)
    let index = (await fetchJson<ChatSession[]>(indexFilePath)) || [];
    
    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    if (isNewSession) {
      // 新規追加
      const newSessionSummary: ChatSession = {
        id: conversationId,
        title: query.substring(0, 20) || "新しいチャット",
        date: formattedDate,
        messages: [], // 一覧にはメッセージを含めない(軽量化)
        difyConversationId: newDifyConversationId,
        type: "resume", // デフォルトタイプ (必要に応じてinputs等から判別)
      };
      index = [newSessionSummary, ...index];
    } else {
      // 既存更新 (先頭に移動)
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

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,
      dify_conversation_id: newDifyConversationId,
    });

  } catch (error: unknown) {
    console.error("Server Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 },
    );
  }
}