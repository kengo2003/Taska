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
    
    const apiKey = process.env.DIFY_QA_API_KEY; 
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      console.error("Config Error: DIFY_QA_API_KEY or DIFY_API_URL is missing.");
      return NextResponse.json({ error: 'Config Error' }, { status: 500 });
    }

    // 型付きの配列として初期化
    const difyFiles: DifyFile[] = [];

    // 1. ファイルアップロード処理
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue;
        const uploadFormData = new FormData();
        uploadFormData.append('file', file, file.name);
        uploadFormData.append('user', user || 'qa-user');

        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          console.error(`File Upload Failed: ${uploadRes.status}`);
          continue;
        }

        // レスポンスの型を指定
        const uploadData = (await uploadRes.json()) as UploadResponse;
        const isImage = file.type.startsWith('image/');
        
        difyFiles.push({
          type: isImage ? 'image' : 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
      }
    }

    // 2. ペイロードの構築
    const chatPayload: ChatPayload = {
      inputs: {}, 
      query: query || "",
      response_mode: 'blocking',
      user: user || 'qa-user',
    };

    if (conversationId && conversationId.trim() !== '' && conversationId !== 'null') {
      chatPayload.conversation_id = conversationId;
    }

    if (difyFiles.length > 0) {
      chatPayload.files = difyFiles;
    }

    console.log('Sending to Dify QA:', JSON.stringify(chatPayload, null, 2));

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
        // エラーレスポンスの型は不明なため unknown として扱う
        errorJson = JSON.parse(errorText) as unknown;
      } catch {
        errorJson = { message: errorText, code: 'unknown_error' };
      }
      return NextResponse.json(errorJson, { status: chatRes.status });
    }

    // 成功レスポンスの型も厳密にするなら定義が必要だが、一旦 unknown か any で受けて返す
    const data = (await chatRes.json()) as unknown;
    return NextResponse.json(data);

  } catch (error: unknown) {
    // catch句の error は unknown 型として扱う
    console.error('Server Error:', error);
    
    // エラーメッセージの安全な取得
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
}