import { NextResponse } from 'next/server';
import { 
  CognitoIdentityProviderClient, 
  AdminDeleteUserCommand,
  ListUsersCommand // 検索用にインポート追加
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    // フロントエンドから "emails" という配列を受け取る想定に変更
    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ message: 'No emails provided' }, { status: 400 });
    }

    const results = [];
    
    // ループ処理
    for (const email of emails) {
      try {
        // ステップ1: メールアドレスからユーザー名(Username)を検索する
        // フィルタ構文: email = "test@example.com"
        const listCommand = new ListUsersCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Filter: `email = "${email}"`,
          Limit: 1, // 1件ヒットすればOK
        });
        
        const listRes = await client.send(listCommand);

        // ユーザーが見つからなかった場合
        if (!listRes.Users || listRes.Users.length === 0) {
          results.push({ email, status: 'failed', error: 'User not found' });
          continue; 
        }

        // ユーザー名を取得（これが削除に必要なIDです）
        const targetUsername = listRes.Users[0].Username;

        // ステップ2: 取得したUsernameを使って削除実行
        const deleteCommand = new AdminDeleteUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: targetUsername,
        });
        
        await client.send(deleteCommand);
        results.push({ email, status: 'deleted' });

      } catch (error: any) {
        console.error(`Failed to delete ${email}:`, error);
        results.push({ email, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({ message: 'Process completed', results });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}