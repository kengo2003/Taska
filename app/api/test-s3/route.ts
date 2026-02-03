// app/api/test-s3/route.ts
import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

// 環境変数の読み込み確認
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKey || "",
    secretAccessKey: secretKey || "",
  },
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    envCheck: {
      hasBucketName: !!bucketName,
      hasRegion: !!region,
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey,
      // 確認用（先頭3文字だけ表示）
      bucketNameStart: bucketName ? `${bucketName.substring(0, 3)}...` : "MISSING",
    },
    connectionTest: "Pending",
    writeTest: "Pending",
    error: null as any,
  };

  try {
    if (!bucketName || !region || !accessKey || !secretKey) {
      throw new Error("環境変数 (.env.local) が設定されていません。");
    }

    // 1. 接続テスト (ファイル一覧取得)
    // これができれば認証と読み取り権限はOK
    await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
    results.connectionTest = "SUCCESS: Connected to S3";

    // 2. 書き込みテスト
    // これができれば書き込み権限もOK
    const testFileName = "connection-test.txt";
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
      Body: "Hello S3! Connection Test Successful.",
    }));
    results.writeTest = "SUCCESS: Wrote file to S3";

    return NextResponse.json(results);

  } catch (e: any) {
    console.error("S3 Test Error:", e);
    results.error = {
      name: e.name,
      message: e.message,
      code: e.Code, // AWSのエラーコード
    };
    return NextResponse.json(results, { status: 500 });
  }
}