import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.path[0];
    const action = resolvedParams.path[1] || 'download'; // file-preview 等

    if (!fileId) return new NextResponse('File ID missing', { status: 400 });

    // DifyのベースURL (例: http://1.2.3.4/v1)
    const envApiUrl = process.env.DIFY_API_URL?.replace(/\/$/, '') || '';
    
    // Web用ベースURL (例: http://1.2.3.4) -> /v1 を削除
    const webBaseUrl = envApiUrl.replace(/\/v1$/, '');

    // クエリパラメータの取得
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    
    // 署名の有無チェック
    const hasSignature = searchParams.has('sign') && searchParams.has('nonce');

    let targetUrl = '';
    const headers: Record<string, string> = {};

    // ----------------------------------------------------------------
    // パターンA: 署名付きリクエスト (ナレッジ画像など)
    // -> パスを改変せず、Webエンドポイントへそのまま転送する
    // ----------------------------------------------------------------
    if (hasSignature) {
      // APIキーは不要 (署名で認証されるため)
      // パスも /v1 をつけず、ブラウザが要求した通り (/files/{id}/{action}) にする
      targetUrl = `${webBaseUrl}/files/${fileId}/${action}?${searchParams.toString()}`;
      
      console.log(`[Proxy] Signed Request (Web): ${targetUrl}`);
    } 
    // ----------------------------------------------------------------
    // パターンB: 署名なしリクエスト (チャット生成画像など)
    // -> APIキーとユーザーIDを使って、APIエンドポイントへアクセスする
    // ----------------------------------------------------------------
    else {
      // ユーザー認証
      const cookieStore = await cookies();
      const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "taska_session")?.value;
      let userId = 'qa-user-fallback';
      if (token) {
        try {
          const claims = await verifyAccessToken(token);
          if (claims.sub) userId = claims.sub;
        } catch (e) {}
      }

      // APIキー
      const apiKey = process.env.DIFY_QA_API_KEY || process.env.DIFY_API_KEY;
      headers['Authorization'] = `Bearer ${apiKey}`;

      // API用URL構築 (/v1/files/...)
      // チャット生成画像は image-preview が正しい場合が多い
      const apiAction = action === 'file-preview' ? 'image-preview' : action;
      
      const targetUser = searchParams.get('user') || userId;
      targetUrl = `${envApiUrl}/files/${fileId}/${apiAction}?user=${targetUser}`;

      console.log(`[Proxy] API Request: ${targetUrl}`);
    }

    // ----------------------------------------------------------------
    // リクエスト実行
    // ----------------------------------------------------------------
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      console.error(`[Proxy] Error: ${response.status} at ${targetUrl}`);
      
      // フォールバック: 署名アクセスで失敗した場合、APIアクセスを試みるなどの救済は
      // 署名エラー(403/404)の場合は無意味なので、ここでは素直にエラーを返します。
      return new NextResponse('File not found or access denied', { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[Proxy] Internal Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}