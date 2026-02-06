import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// S3クライアントの初期化（サーバーサイドでのみ実行される）
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, vote, content, timestamp } = body;

    // 1. 一意なファイル名を生成
    const fileId = uuidv4();
    
    // 2. 日付ごとにフォルダを分ける (YYYY/MM/DD/ファイル名.json)
    // ※これが後でデータを見る時に非常に役立ちます
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    
    const s3Key = `feedback/${yyyy}/${mm}/${dd}/${fileId}.json`;

    // 3. 保存するデータの中身
    const feedbackData = {
      id: fileId,
      message_id: messageId,
      vote: vote,             // "good" または "bad"
      content: content,       // AIの回答テキスト
      created_at: timestamp,
      user_agent: req.headers.get("user-agent"), // 任意: ブラウザ情報
    };

    // 4. S3へアップロード実行
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_FEEDBACK_BUCKET_NAME,
      Key: s3Key,
      Body: JSON.stringify(feedbackData, null, 2), // 見やすく整形して保存
      ContentType: "application/json",
    });

    await s3.send(command);

    console.log(`Feedback saved to S3: ${s3Key}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}