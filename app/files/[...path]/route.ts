import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.path[0];
    const action = resolvedParams.path[1] || "download";

    if (!fileId) return new NextResponse("File ID missing", { status: 400 });

    const envApiUrl = process.env.DIFY_API_URL?.replace(/\/$/, "") || "";

    const webBaseUrl = envApiUrl.replace(/\/v1$/, "");

    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);

    const hasSignature = searchParams.has("sign") && searchParams.has("nonce");

    let targetUrl = "";
    const headers: Record<string, string> = {};

    if (hasSignature) {
      targetUrl = `${webBaseUrl}/files/${fileId}/${action}?${searchParams.toString()}`;

      console.log(`[Proxy] Signed Request (Web): ${targetUrl}`);
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get(
        process.env.AUTH_COOKIE_NAME || "taska_session",
      )?.value;
      let userId = "qa-user-fallback";
      if (token) {
        try {
          const claims = await verifyAccessToken(token);
          if (claims.sub) userId = claims.sub;
        } catch (e) {
          console.log("error: token");
        }
      }

      const apiKey = process.env.DIFY_QA_API_KEY || process.env.DIFY_API_KEY;
      headers["Authorization"] = `Bearer ${apiKey}`;

      const apiAction = action === "file-preview" ? "image-preview" : action;

      const targetUser = searchParams.get("user") || userId;
      targetUrl = `${envApiUrl}/files/${fileId}/${apiAction}?user=${targetUser}`;

      console.log(`[Proxy] API Request: ${targetUrl}`);
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      console.error(`[Proxy] Error: ${response.status} at ${targetUrl}`);

      return new NextResponse("File not found or access denied", {
        status: response.status,
      });
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
