import { NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
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
    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { message: "No emails provided" },
        { status: 400 },
      );
    }

    const results = [];

    for (const email of emails) {
      try {
        const listCommand = new ListUsersCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Filter: `email = "${email}"`,
          Limit: 1,
        });

        const listRes = await client.send(listCommand);

        if (!listRes.Users || listRes.Users.length === 0) {
          results.push({ email, status: "failed", error: "User not found" });
          continue;
        }

        const targetUsername = listRes.Users[0].Username;

        const deleteCommand = new AdminDeleteUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: targetUsername,
        });

        await client.send(deleteCommand);
        results.push({ email, status: "deleted" });
      } catch (error: any) {
        console.error(`Failed to delete ${email}:`, error);
        results.push({ email, status: "failed", error: error.message });
      }
    }

    return NextResponse.json({ message: "Process completed", results });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
