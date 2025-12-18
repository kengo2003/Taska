import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const user = formData.get('user') as string;
    const conversationId = formData.get('conversation_id') as string;
    const files = formData.getAll('file') as File[];
    
    // 環境変数からQ&A用のAPIキーを取得（必ず.envに追加してください）
    const apiKey = process.env.DIFY_QA_API_KEY; 
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Config Error: API Key or URL missing' }, { status: 500 });
    }

    const difyFiles: Record<string, any>[] = [];

    // 1. ファイルアップロード処理 (Difyへの転送)
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

        const uploadData = await uploadRes.json();
        const isImage = file.type.startsWith('image/');
        
        difyFiles.push({
          type: isImage ? 'image' : 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
      }
    }

    // 2. チャット送信
    const chatPayload = {
      inputs: {}, 
      query: query,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: user || 'qa-user',
      files: difyFiles
    };

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
      return NextResponse.json({ error: errorText }, { status: chatRes.status });
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