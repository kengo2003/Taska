import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchJson } from "@/lib/s3-db";
import { verifyIdToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      process.env.AUTH_COOKIE_NAME || "taska_session",
    )?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token" },
        { status: 401 },
      );
    }

    let userId: string;
    try {
      const claims = await verifyIdToken(token);
      userId = claims.sub as string;
    } catch (e) {
      console.error("Token verify error:", e);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const filePath = `users/${userId}/chat/sessions/${id}.json`;

    const history = await fetchJson(filePath);

    if (!history) {
      return NextResponse.json({ error: "History not found" }, { status: 404 });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("History detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
