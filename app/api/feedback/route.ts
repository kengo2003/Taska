import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// S3クライアントの初期化
// ※環境変数が正しく読み込まれていることを確認してください
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    // フロントエンドから送られてきたデータを受け取る
    const body = await req.json();
    
    // userPrompt（質問文）もここで受け取ります
    const { messageId, vote, content, userPrompt, timestamp } = body;

    // 1. 保存するJSONファイルの一意な名前を生成
    const fileId = uuidv4();
    
    // 2. 保存パスの生成 (パーティショニング: YYYY/MM/DD/ファイル名.json)
    // 日付でフォルダを分けることで、後でAthena等で分析しやすくします
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    
    // キー例: feedback/2026/02/06/xxxxx-xxxx-xxxx.json
    const s3Key = `feedback/${yyyy}/${mm}/${dd}/${fileId}.json`;

    // 3. 保存データ構築
    // 分析に必要な情報をすべて詰め込みます
    const dataToSave = {
      id: fileId,                 // ログ自体のID
      message_id: messageId,      // チャットメッセージのID (グルーピング用)
      vote: vote,                 // "good" | "bad" | null (取り消し)
      user_query: userPrompt,     // ユーザーが何を聞いたか
      ai_response: content,       // AIがどう答えたか
      created_at: timestamp,      // 評価された時刻
    };

    // 4. S3へアップロード実行
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_FEEDBACK_BUCKET_NAME, // .env.localで指定した独自のバケット名
      Key: s3Key,
      Body: JSON.stringify(dataToSave, null, 2), // 整形してJSON化
      ContentType: "application/json",
    });

    await s3.send(command);

    console.log(`Feedback saved to S3: ${s3Key}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("S3 Upload Error:", error);
    // エラー詳細を返すとデバッグしやすいですが、本番環境では適宜隠蔽してください
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}