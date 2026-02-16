import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

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

    const { messageId, vote, content, userPrompt, timestamp } = body;

    const fileId = uuidv4();

    const now = new Date();
    const yyyy = now.getFullYear();
    // const mm = String(now.getMonth() + 1).padStart(2, "0");
    // const dd = String(now.getDate()).padStart(2, "0");

    let s3Key;
    if (vote == "good") {
      s3Key = `feedback/${yyyy}/good/${fileId}.json`;
    } else if (vote == "bad") {
      s3Key = `feedback/${yyyy}/bad/${fileId}.json`;
    } else {
      console.log("[log]: No votes");
    }

    const dataToSave = {
      id: fileId,
      message_id: messageId,
      vote: vote,
      user_query: userPrompt,
      ai_response: content,
      created_at: timestamp,
    };

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_FEEDBACK_BUCKET_NAME,
      Key: s3Key,
      Body: JSON.stringify(dataToSave, null, 2),
      ContentType: "application/json",
    });

    await s3.send(command);

    console.log(`Feedback saved to S3: ${s3Key}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
