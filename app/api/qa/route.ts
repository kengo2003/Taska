import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME, fetchJson, saveJson } from "@/lib/s3-db";
import { verifyIdToken } from "@/lib/auth/jwt";
import { getCurrentJSTTime } from "@/lib/utils";
import {
  ChatSession,
  Message,
  DifyFile,
  UploadResponse,
  ChatPayload,
  LocalAttachment,
} from "@/types/type";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      process.env.AUTH_COOKIE_NAME || "taska_session",
    )?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token" },
        { status: 401 },
      );
    }

    let userId: string;
    let userEmail: string = "";

    try {
      const claims = await verifyIdToken(token);
      userId = claims.sub as string;
      userEmail = (claims.email as string) || "unknown";

      console.log(`[QA] Auth Success - User: ${userEmail} (ID: ${userId})`);
    } catch (e) {
      console.error("Token verification failed:", e);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const query = formData.get("query") as string;
    let conversationId = formData.get("conversation_id") as string;
    const incomingDifyConversationId = formData.get(
      "dify_conversation_id",
    ) as string;
    const files = formData.getAll("file") as File[];

    const apiKey = process.env.DIFY_QA_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "");

    if (!apiKey || !apiUrl) {
      console.error("[QA] Config Error: API Key or URL missing");
      return NextResponse.json({ error: "Config Error" }, { status: 500 });
    }

    const isNewSession =
      !conversationId || conversationId === "null" || conversationId === "";

    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
      console.log(
        `[QA] New Session Created: ${conversationId} by ${userEmail}`,
      );
    } else {
      console.log(`[QA] Existing Session: ${conversationId} by ${userEmail}`);
    }

    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      console.log(
        `[QA] Processing ${files.length} files concurrently for ${userEmail}`,
      );

      const uploadPromises = files.map(async (file) => {
        if (file.size === 0) return null;
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `users/${userId}/uploads/${conversationId}/${Date.now()}_${file.name}`;

          const s3Promise = s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: fileKey,
              Body: buffer,
              ContentType: file.type,
            }),
          );

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

          const [, uploadData] = await Promise.all([
            s3Promise,
            difyUploadPromise,
          ]);

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
            } as DifyFile,
          };
        } catch (e) {
          console.error(`[QA] File Error for ${userEmail}:`, e);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);

      results.forEach((res) => {
        if (res) {
          localAttachments.push(res.local);
          difyFiles.push(res.dify);
        }
      });
    }

    const chatPayload: ChatPayload = {
      inputs: {},
      query: query || "",
      response_mode: "blocking",
      user: userId,
      conversation_id: incomingDifyConversationId || undefined,
      files: difyFiles.length > 0 ? difyFiles : undefined,
    };

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error(
        `[QA] Dify API Error for ${userEmail}: ${chatRes.status} ${errText}`,
      );
      return NextResponse.json({ error: errText }, { status: chatRes.status });
    }

    const data = await chatRes.json();

    if (data.answer && typeof data.answer === "string") {
      data.answer = data.answer
        .replace(/https?:\/\/[^)]+\/v1\/files\//g, "/files/")
        .replace(/https?:\/\/[^)]+\/files\//g, "/files/");
    }
    const newDifyConversationId = data.conversation_id;

    const sessionFilePath = `users/${userId}/chat/sessions/${conversationId}.json`;
    const indexFilePath = `users/${userId}/chat/index.json`;

    const formattedDate = getCurrentJSTTime();

    const saveSessionPromise = (async () => {
      let sessionData: { messages: Message[]; email?: string } = {
        messages: [],
      };
      if (!isNewSession) {
        const existing = await fetchJson<{
          messages: Message[];
          email?: string;
        }>(sessionFilePath);
        if (existing) sessionData = existing;
      }

      sessionData.messages.push({
        role: "user",
        content: query,
        attachments: localAttachments,
        date: formattedDate,
      });
      sessionData.messages.push({
        role: "assistant",
        content: data.answer,
        attachments: [],
        date: formattedDate,
      });

      await saveJson(sessionFilePath, {
        messages: sessionData.messages,
        difyConversationId: newDifyConversationId,
        type: "qa",
        id: conversationId,
        email: userEmail,
        date: formattedDate,
      });
      console.log(
        `[QA] Session saved: ${sessionFilePath} (User: ${userEmail})`,
      );
    })();

    const saveIndexPromise = (async () => {
      const index = (await fetchJson<ChatSession[]>(indexFilePath)) || [];

      if (isNewSession) {
        index.unshift({
          id: conversationId,
          title: query.substring(0, 20) || "QAチャット",
          date: formattedDate,
          email: userEmail,
          messages: [],
          difyConversationId: newDifyConversationId,
          type: "qa",
        });
      } else {
        const targetIndex = index.findIndex((s) => s.id === conversationId);
        if (targetIndex > -1) {
          const target = index[targetIndex];
          index.splice(targetIndex, 1);
          index.unshift({
            ...target,
            date: formattedDate,
            email: userEmail,
            difyConversationId: newDifyConversationId,
          });
        }
      }
      await saveJson(indexFilePath, index);
      console.log(`[QA] Index updated for ${userEmail}`);
    })();

    await Promise.all([saveSessionPromise, saveIndexPromise]);

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,
      dify_conversation_id: newDifyConversationId,
    });
  } catch (error: unknown) {
    console.error("[QA] Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
