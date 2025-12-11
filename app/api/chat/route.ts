// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const user = formData.get('user') as string;
    const files = formData.getAll('file') as File[];
    // inputsがあれば取得（なければ空）
    const inputsString = formData.get('inputs') as string;

    const apiKey = process.env.DIFY_API_KEY;
    // URLの末尾にスラッシュがあれば削除して正規化
    const apiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '');

    if (!apiKey || !apiUrl) {
      return NextResponse.json({ error: 'Config Error: API Key or URL missing' }, { status: 500 });
    }

    let difyFiles = [];

    // 1. ファイルアップロード処理 (Difyへ)
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files...`);

      for (const file of files) {
        if (file.size === 0) continue;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file, file.name);
        uploadFormData.append('user', user || 'user-123');

        // DifyのファイルアップロードAPIを叩く
        const uploadRes = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          console.error(`Upload Failed:`, await uploadRes.text());
          continue;
        }

        const uploadData = await uploadRes.json();
        
        // 画像かドキュメントか判定
        const isImage = file.type.startsWith('image/');
        const fileType = isImage ? 'image' : 'document';

        difyFiles.push({
          type: fileType,
          transfer_method: 'local_file',
          upload_file_id: uploadData.id,
        });
        
        console.log(`✅ Uploaded: ${file.name} (ID: ${uploadData.id})`);
      }
    }

    // 2. inputs の準備
    let inputs: Record<string, any> = {};
    try {
      if (inputsString) inputs = JSON.parse(inputsString);
    } catch (e) {}

    // ★重要: アップロードしたファイルがある場合、doc変数にも渡しておく
    // (Difyの設定によっては不要ですが、参考コードにあるため維持します)
    if (difyFiles.length > 0) {
      inputs['doc'] = difyFiles;
    }

    // 3. チャット送信
    // クエリが空の場合のデフォルト値を設定
    const sendQuery = query || "アップロードされたファイルを分析してください";

    const chatPayload = {
      inputs: inputs,
      query: sendQuery,
      response_mode: 'blocking',
      conversation_id: '',
      user: user || 'user-123',
      files: difyFiles // ここでファイルを紐付ける
    };

    console.log('Sending to Chat:', JSON.stringify(chatPayload, null, 2));

    const chatRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatRes.ok) {
      const err = await chatRes.json().catch(() => ({}));
      console.error('Chat Failed:', err);
      return NextResponse.json({ error: err }, { status: chatRes.status });
    }

    const data = await chatRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}