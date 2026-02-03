// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
// 作成したライブラリと型定義をインポート
import { s3, BUCKET_NAME, fetchJson, saveJson } from '@/lib/s3-db';
import { ChatSession, Message } from '@/types/type';

// --- 型定義 ---

interface DifyFile {
  type: 'image' | 'document';
  transfer_method: 'local_file' | 'remote_url';
  upload_file_id: string;
}

interface DifyUploadResponse {
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
    const user = formData.get('user') as string;
    
    // アプリ管理用のID (S3保存時のファイル名)
    let conversationId = formData.get('conversation_id') as string;
    
    // ★追加: Dify管理用のID (AIの文脈維持用)
    const incomingDifyConversationId = formData.get('dify_conversation_id') as string;

    const files = formData.getAll('file') as File[];
    const inputsString = formData.get('inputs') as string;

    const apiKey = process.env.DIFY_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Config Error: API Key or URL missing' }, { status: 500 });
    }

    // --- 1. セッションIDの確定 (アプリ用) ---
    const isNewSession = !conversationId || conversationId === 'null' || conversationId === '';
    if (isNewSession) {
      conversationId = Math.random().toString(36).substring(2, 10);
    }

    // --- 2. ファイル処理 (S3 & Dify) ---
    const difyFiles: DifyFile[] = [];
    const localAttachments: LocalAttachment[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;

        // A. S3アップロード
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileKey = `chat/uploads/${conversationId}/${Date.now()}_${file.name}`;
        
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
          //ACL: "public-read",
        }));
        
        const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
        
        localAttachments.push({
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: s3Url
        });

        // B. Difyアップロード
        const uploadFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        uploadFormData.append('file', blob, file.name);
        uploadFormData.append('user', user || 'user-123');

        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          console.error(`Dify File Upload Failed:`, await uploadRes.text());
          continue; 
        }

        const uploadData = (await uploadRes.json()) as DifyUploadResponse;
        difyFiles.push({
          type: file.type.startsWith('image/') ? 'image' : 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
      }
    }

    let inputs: Record<string, unknown> = {};
    try {
      if (inputsString) {
        inputs = JSON.parse(inputsString);
      }
    } catch (e) {
      console.warn('Failed to parse inputs JSON:', e);
    }

    if (difyFiles.length > 0) {
      inputs['doc'] = difyFiles;
    }

    // --- 3. Difyへチャット送信 ---
    const chatPayload: ChatPayload = {
      inputs: inputs,
      query: query,
      response_mode: 'blocking',
      user: user || 'user-123',
    };

    // ★修正: Difyへ送るIDは、フロントから受け取ったDifyIDを使用する
    if (incomingDifyConversationId) {
       chatPayload.conversation_id = incomingDifyConversationId;
    }
    
    if (difyFiles.length > 0) {
      chatPayload.files = difyFiles;
    }

    // console.log('Sending to Dify:', JSON.stringify(chatPayload, null, 2));

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      throw new Error(`Dify API Error: ${chatRes.status} ${await chatRes.text()}`);
    }

    const data = (await chatRes.json()) as any;
    
    // Difyから返却された最新の会話ID
    const newDifyConversationId = data.conversation_id;

    // --- 4. S3へ履歴保存 ---
    
    // 既存履歴取得
    let sessionData: { messages: Message[] } = { messages: [] };
    if (!isNewSession) {
      const existing = await fetchJson<{ messages: Message[] }>(`chat/sessions/${conversationId}.json`);
      if (existing) sessionData = existing;
    }

    // ユーザーメッセージ追加
    const userMessage: Message = {
      role: 'user',
      content: query,
      attachments: localAttachments,
    };
    sessionData.messages.push(userMessage);

    // AIメッセージ追加
    const assistantMessage: Message = {
      role: 'assistant',
      content: data.answer,
      attachments: [], 
    };
    sessionData.messages.push(assistantMessage);

    // 詳細JSON保存
    await saveJson(`chat/sessions/${conversationId}.json`, {
      messages: sessionData.messages,
      // ★保存: 次回のためにDifyIDも保存しておく
      difyConversationId: newDifyConversationId,
    });

    // 一覧更新 (新規時)
    if (isNewSession) {
      const index = (await fetchJson<ChatSession[]>('chat/index.json')) || [];
      const newSessionSummary: ChatSession = {
        id: conversationId,
        title: query.substring(0, 20) || '新しいチャット',
        date: new Date().toLocaleDateString('ja-JP'),
        messages: [],
        difyConversationId: newDifyConversationId, // ここにも保存
        type: 'resume',
      };
      await saveJson('chat/index.json', [newSessionSummary, ...index]);
    }

    return NextResponse.json({
      ...data,
      conversation_id: conversationId,            // アプリ用ID
      dify_conversation_id: newDifyConversationId // フロントへ返すDify用ID
    });

  } catch (error: unknown) {
    console.error('Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}