import { fetchJson } from "@/lib/s3-db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // paramsをPromise型として定義
) {
  try {
    // params を await して取り出す
    const { id } = await params;

    // その後の処理で id を使用
    const history: any = await fetchJson(`chat/sessions/${id}.json`);

    return Response.json(history);
  } catch {
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
