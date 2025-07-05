import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

// 環境変数からテーブル名を取得
const tableName = process.env.TABLE_NAME!;
const client = new DynamoDBClient({});

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text;

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "text is required" }),
      };
    }

    const timestamp = new Date().toISOString();

    const command = new PutItemCommand({
      TableName: tableName,
      Item: {
        timestamp: { S: timestamp },
        text: { S: text },
      },
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "保存完了" }),
    };
  } catch (err: any) {
    console.error("Error writing to DynamoDB:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "保存に失敗しました" }),
    };
  }
};
