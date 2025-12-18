// app/api/chat/route.ts
import { NextResponse } from 'next/server';

// Dify API用の型定義
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const user = formData.get('user') as string;
    const conversationId = formData.get('conversation_id') as string;
    const files = formData.getAll('file') as File[];
    const inputsString = formData.get('inputs') as string;

    const apiKey = process.env.DIFY_API_KEY;
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Config Error: API Key or URL missing' }, { status: 500 });
    }

    // constに変更し型定義
    const difyFiles: DifyFile[] = [];

    // 1. ファイルアップロード処理
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;
        const uploadFormData = new FormData();
        uploadFormData.append('file', file, file.name);
        uploadFormData.append('user', user || 'user-123');

        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          console.error(`File Upload Failed (${uploadRes.status}):`, errText);
          continue;
        }

        const uploadData = (await uploadRes.json()) as UploadResponse;
        const isImage = file.type.startsWith('image/');
        difyFiles.push({
          type: isImage ? 'image' : 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
      }
    }

    let inputs: Record<string, unknown> = {};
    try {
      if (inputsString) {
        inputs = JSON.parse(inputsString) as Record<string, unknown>;
      }
    } catch (e) {
      console.warn('Failed to parse inputs JSON:', e);
    }

    // 既存ロジックの維持: inputs['doc'] にもファイル情報を入れている場合
    if (difyFiles.length > 0) {
      inputs['doc'] = difyFiles;
    }

    // 2. チャット送信ペイロードの構築
    const chatPayload: ChatPayload = {
      inputs: inputs,
      query: query,
      response_mode: 'blocking',
      user: user || 'user-123',
    };

    // conversation_id が空文字やnullの場合はプロパティを含めない
    if (conversationId && conversationId.trim() !== '' && conversationId !== 'null') {
      chatPayload.conversation_id = conversationId;
    }

    // files がある場合のみプロパティを含める
    if (difyFiles.length > 0) {
      chatPayload.files = difyFiles;
    }

    console.log('Sending to Dify:', JSON.stringify(chatPayload, null, 2));

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      const errorText = await chatRes.text();
      console.error(`Dify Chat Error (${chatRes.status}):`, errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText) as unknown;
      } catch {
        errorJson = { message: errorText, code: chatRes.status };
      }
      
      return NextResponse.json(errorJson, { status: chatRes.status });
    }

    const data = (await chatRes.json()) as unknown;
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}