// app/api/chat/route.ts
import { NextResponse } from 'next/server';

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

    let difyFiles = [];

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

        const uploadData = await uploadRes.json();
        const isImage = file.type.startsWith('image/');
        difyFiles.push({
          type: isImage ? 'image' : 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
      }
    }

    let inputs: Record<string, any> = {};
    try {
      if (inputsString) inputs = JSON.parse(inputsString);
    } catch (e) {}

    if (difyFiles.length > 0) {
      inputs['doc'] = difyFiles;
    }

    // 2. チャット送信
    const chatPayload = {
      inputs: inputs,
      query: query,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: user || 'user-123',
      files: difyFiles
    };

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
      // ★修正: エラーをJSONと決めつけず、テキストとして取得してログに出す
      const errorText = await chatRes.text();
      console.error(`Dify Chat Error (${chatRes.status}):`, errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { message: errorText, code: chatRes.status };
      }
      
      return NextResponse.json(errorJson, { status: chatRes.status });
    }

    const data = await chatRes.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}