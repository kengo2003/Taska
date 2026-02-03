import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
// 既存のライブラリからインポート
import { s3, BUCKET_NAME, fetchJson, saveJson } from '@/lib/s3-db';
// 型定義は環境に合わせて調整してください
import { ChatSession, Message } from '@/types/type';

// --- 型定義 ---
interface DifyFile {
  type: 'image' | 'document';
  transfer_method: 'local_file' | 'remote_url';
  upload_file_id: string;
}

interface UploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

interface ChatPayload {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  user: string;
  conversation_id?: string;
  files?: DifyFile[];
}

interface LocalAttachment {
  name: string;
  type: 'image' | 'file';
  url: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const user = formData.get('user') as string || 'qa-user';
    let conversationId = formData.get('conversation_id') as string;
    const incomingDifyConversationId = formData.get('dify_conversation_id') as string;
    const files = formData.getAll('file') as File[];
    
    const apiKey = process.env.DIFY_QA_API_KEY; 
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      console.error("Config Error: DIFY_QA_API_KEY or DIFY_API_URL is missing.");
      return NextResponse.json({ error: 'Config Error' }, { status: 500 });
    }

    // --- 1. ID確定 ---
    const isNewSession = !conversationId || conversationId === 'null' || conversationId === '';
    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
      console.log(`[QA] New Session Created: ${conversationId}`);
    } else {
      console.log(`[QA] Existing Session: ${conversationId}`);
    }

    // --- 2. ファイル処理 ---
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;
        
        // S3アップロード
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `chat/uploads/${conversationId}/${Date.now()}_${file.name}`;
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
          }));
          const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
          localAttachments.push({
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: s3Url
          });
          console.log(`[QA] File uploaded to S3: ${fileKey}`);
        } catch (e) {
          console.error('[QA] S3 Upload Error:', e);
        }

        // Difyアップロード
        const uploadFormData = new FormData();
        uploadFormData.append('file', file, file.name);
        uploadFormData.append('user', user);

        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as UploadResponse;
          difyFiles.push({
            type: file.type.startsWith('image/') ? 'image' : 'document',
            transfer_method: 'local_file',
            upload_file_id: uploadData.id,
          });
        }
      }
    }

    // --- 3. Difyへ送信 ---
    const chatPayload: ChatPayload = {
      inputs: {}, 
      query: query || "",
      response_mode: 'blocking',
      user: user,
    };
    if (incomingDifyConversationId) chatPayload.conversation_id = incomingDifyConversationId;
    if (difyFiles.length > 0) chatPayload.files = difyFiles;

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      console.error(`Dify Chat Error: ${chatRes.status}`);
      return NextResponse.json({ error: await chatRes.text() }, { status: chatRes.status });
    }

    const data = (await chatRes.json()) as any;
    const newDifyConversationId = data.conversation_id;

    // --- 4. S3へ履歴保存 (ログ追加) ---
    console.log('[QA] Saving history to S3...');
    
    let sessionData: { messages: Message[] } = { messages: [] };
    if (!isNewSession) {
      const existing = await fetchJson<{ messages: Message[] }>(`chat/sessions/${conversationId}.json`);
      if (existing) sessionData = existing;
    }

    sessionData.messages.push({
      role: 'user',
      content: query,
      attachments: localAttachments,
    });
    sessionData.messages.push({
      role: 'assistant',
      content: data.answer,
      attachments: [],
    });

    // セッション保存
    await saveJson(`chat/sessions/${conversationId}.json`, {
      messages: sessionData.messages,
      difyConversationId: newDifyConversationId,
      type: 'qa'
    });
    console.log(`[QA] Session saved: chat/sessions/${conversationId}.json`);

    // 一覧更新
    if (isNewSession) {
      const index = (await fetchJson<ChatSession[]>('chat/index.json')) || [];
      const newSessionSummary: ChatSession = {
        id: conversationId,
        title: query.substring(0, 20) || 'QAチャット',
        date: new Date().toLocaleDateString('ja-JP'),
        messages: [],
        difyConversationId: newDifyConversationId,
        type: 'qa',
      };
      await saveJson('chat/index.json', [newSessionSummary, ...index]);
      console.log('[QA] Index updated: chat/index.json');
    }

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,
      dify_conversation_id: newDifyConversationId
    });

  } catch (error: any) {
    console.error('[QA] Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}