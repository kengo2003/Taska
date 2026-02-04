import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const fileId = resolvedParams.path[0];

  if (!fileId) {
    return new NextResponse("File ID missing", { status: 400 });
  }

  const baseUrl = process.env.DIFY_API_URL?.replace(/\/$/, "") || "";

  // ユーザーIDを固定値（チャット時と同じもの）にする
  // ブラウザのURLに ?user=... がなくても、ここで強制的に付与します
  const url = new URL(req.url);
  const user = url.searchParams.get("user") || "local-user-qa";

  // エンドポイントは "download" のままでOK
  const targetUrl = `${baseUrl}/files/${fileId}/download?user=${user}`;

  // APIキーは QA用 を優先（チャットと同じアプリのキーを使うため）
  const apiKey = process.env.DIFY_QA_API_KEY || process.env.DIFY_API_KEY;

  console.log(`[Proxy] Requesting: ${targetUrl} (User: ${user})`);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error(`[Proxy] Error: ${response.status} at ${targetUrl}`);
      return new NextResponse("File not found", { status: 404 });
    }

    const contentType =
      response.headers.get("Content-Type") || "application/octet-stream";

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Proxy] Internal Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
