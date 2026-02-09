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
      
      console.log(`[QA] Auth Success - User: ${userEmail} (ID: ${userId})`);
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
    
    // QA用のAPIキーを使用
    const apiKey = process.env.DIFY_QA_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "");

    if (!apiKey || !apiUrl) {
      console.error("[QA] Config Error: API Key or URL missing");
      return NextResponse.json({ error: "Config Error" }, { status: 500 });
    }

    const isNewSession = !conversationId || conversationId === "null" || conversationId === "";
    
    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
      console.log(`[QA] New Session Created: ${conversationId} by ${userEmail}`);
    } else {
      console.log(`[QA] Existing Session: ${conversationId} by ${userEmail}`);
    }

    // ----------------------------------------------------------------
    // 3. ファイル処理（並列化による高速化 - 既存ロジック維持）
    // ----------------------------------------------------------------
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      console.log(`[QA] Processing ${files.length} files concurrently for ${userEmail}`);

      const uploadPromises = files.map(async (file) => {
        if (file.size === 0) return null;
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `users/${userId}/uploads/${conversationId}/${Date.now()}_${file.name}`;

          // S3アップロード
          const s3Promise = s3.send(new PutObjectCommand({ 
            Bucket: BUCKET_NAME, Key: fileKey, Body: buffer, ContentType: file.type 
          }));

          // Difyアップロード
          const difyUploadPromise = (async () => {
             const uploadFormData = new FormData();
             const blob = new Blob([buffer], { type: file.type });
             uploadFormData.append("file", blob, file.name);
             uploadFormData.append("user", userId);

             const res = await fetch(`${apiUrl}/files/upload`, {
               method: "POST",
               headers: { Authorization: `Bearer ${apiKey}` },
               body: uploadFormData,
             });
             if (!res.ok) throw new Error(await res.text());
             return res.json() as Promise<UploadResponse>;
          })();

          // 両方の完了を待つ (未使用変数の警告回避)
          const [, uploadData] = await Promise.all([s3Promise, difyUploadPromise]);

          return {
            local: {
              name: file.name,
              type: file.type.startsWith("image/") ? "image" : "file",
              url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
            } as LocalAttachment,
            dify: {
              type: file.type.startsWith("image/") ? "image" : "document",
              transfer_method: "local_file",
              upload_file_id: uploadData.id,
            } as DifyFile
          };

        } catch(e) { 
          console.error(`[QA] File Error for ${userEmail}:`, e); 
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      results.forEach(res => {
        if (res) {
          localAttachments.push(res.local);
          difyFiles.push(res.dify);
        }
      });
    }

    // ----------------------------------------------------------------
    // 4. Difyへ送信 (★Streamingモードに変更)
    // ----------------------------------------------------------------
    const chatPayload: ChatPayload = {
      inputs: {},
      query: query || "",
      response_mode: "streaming", // ★ここを streaming に変更
      user: userId,
      conversation_id: incomingDifyConversationId || undefined,
      files: difyFiles.length > 0 ? difyFiles : undefined
    };

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok || !chatRes.body) {
      const errText = await chatRes.text();
      console.error(`[QA] Dify API Error for ${userEmail}: ${chatRes.status} ${errText}`);
      return NextResponse.json({ error: errText }, { status: chatRes.status });
    }

    // ----------------------------------------------------------------
    // 5. ストリーミングレスポンスの作成とS3保存
    // ----------------------------------------------------------------
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // S3保存用に回答全体と会話IDを保持する変数
    let fullAnswer = "";
    let finalDifyConversationId = incomingDifyConversationId || "";

    const stream = new ReadableStream({
      async start(controller) {
        // @ts-expect-error: web standard vs node types mismatch workaround
        const reader = chatRes.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // 最後の不完全な行は次回へ

            for (const line of lines) {
              if (line.trim() === "" || !line.startsWith("data:")) continue;
              
              const jsonStr = line.replace("data:", "").trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const data = JSON.parse(jsonStr);
                const event = data.event;

                // テキスト生成イベント
                if (event === "message" || event === "agent_message") {
                  const answerChunk = data.answer;
                  if (answerChunk) {
                    fullAnswer += answerChunk;
                    // クライアントへ送信
                    controller.enqueue(encoder.encode(answerChunk));
                  }
                  if (data.conversation_id) finalDifyConversationId = data.conversation_id;
                }
                
                // 会話完了時のID取得
                if (event === "message_end" && data.conversation_id) {
                   finalDifyConversationId = data.conversation_id;
                }
                
                // エラー時
                if (event === "error") {
                   console.error("Dify Stream Error Event:", data);
                }

              } catch (e) {
                console.warn("JSON Parse Error in stream:", e);
              }
            }
          }
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        } finally {
          controller.close();
          
          // ★ストリーム完了後にS3へ保存
          // URLプロキシ置換処理が必要ならここで fullAnswer に対して行う
          // 例: fullAnswer = fullAnswer.replace(/.../g, '/files/');
          
          if (fullAnswer) {
             saveQASessionToS3(
                userId, userEmail, conversationId, query, 
                fullAnswer, finalDifyConversationId, isNewSession, localAttachments
             ).catch(err => console.error("S3 Save Error:", err));
          }
        }
      },
    });

    // ヘッダーにIDを含めて返す
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-ID": conversationId,
        "X-Dify-Conversation-ID": finalDifyConversationId,
      },
    });

  } catch (error: unknown) {
    console.error("[QA] Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// ヘルパー関数: S3への保存ロジック (QA用)
// ----------------------------------------------------------------
async function saveQASessionToS3(
  userId: string, 
  userEmail: string, 
  conversationId: string, 
  query: string, 
  answer: string, 
  difyConversationId: string,
  isNewSession: boolean,
  localAttachments: LocalAttachment[]
) {
  const sessionFilePath = `users/${userId}/chat/sessions/${conversationId}.json`;
  const indexFilePath = `users/${userId}/chat/index.json`;
  
  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // 1. セッション詳細(JSON)の保存
  const saveSessionPromise = (async () => {
    let sessionData: { messages: Message[]; email?: string } = { messages: [] };
    
    if (!isNewSession) {
      // 既存ファイルの取得
      const existing = await fetchJson<{ messages: Message[]; email?: string }>(sessionFilePath);
      if (existing) sessionData = existing;
    }
    
    sessionData.messages.push({ role: "user", content: query, attachments: localAttachments, date: formattedDate });
    sessionData.messages.push({ role: "assistant", content: answer, attachments: [], date: formattedDate });

    await saveJson(sessionFilePath, {
      messages: sessionData.messages,
      difyConversationId: difyConversationId,
      id: conversationId,
      type: "qa",
      email: userEmail,
    });
    console.log(`[QA] Session saved: ${sessionFilePath} (User: ${userEmail})`);
  })();

  // 2. インデックス(一覧)の更新準備
  const updateIndexPromise = (async () => {
    const index = (await fetchJson<ChatSession[]>(indexFilePath)) || [];
    
    if (isNewSession) {
      // 新規追加
      index.unshift({
        id: conversationId, 
        title: query.substring(0, 20) || "QAチャット", 
        date: formattedDate,
        email: userEmail, 
        messages: [], 
        difyConversationId: difyConversationId, 
        type: "qa",
      });
    } else {
      // 既存更新（先頭に持ってくる）
      const targetIndex = index.findIndex(s => s.id === conversationId);
      if (targetIndex > -1) {
        const target = index[targetIndex];
        index.splice(targetIndex, 1);
        index.unshift({ 
          ...target, 
          date: formattedDate, 
          email: userEmail, 
          difyConversationId: difyConversationId 
        });
      }
    }
    await saveJson(indexFilePath, index);
    console.log(`[QA] Index updated for ${userEmail}`);
  })();

  await Promise.all([saveSessionPromise, updateIndexPromise]);
}