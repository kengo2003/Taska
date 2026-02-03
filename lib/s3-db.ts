import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// 環境変数からS3クライアントを初期化
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

// JSONデータを取得する関数
export async function fetchJson<T>(key: string): Promise<T | null> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const response = await s3.send(command);
    const str = await response.Body?.transformToString();
    return str ? JSON.parse(str) : null;
  } catch (e: any) {
    if (e.name === 'NoSuchKey') return null; // ファイルがない場合はnullを返す
    throw e;
  }
}

// JSONデータを保存する関数
export async function saveJson(key: string, data: any) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  });
  await s3.send(command);
}

export { s3, BUCKET_NAME };