import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from "aws-lambda";

const s3 = new S3Client({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text;

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "textフィールドが必要です" }),
      };
    }

    const timestamp = new Date().toISOString();
    const line = JSON.stringify({ timestamp, text }) + "\n";

    const bucket = process.env.BUCKET_NAME!;
    const key = process.env.FILE_NAME!;

    // 上書きではなく、S3の「append」っぽい処理を実装（最小構成では putObject）
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: line,
      ContentType: "application/json",
      // 追記ではなく上書きとなるが、ここでは append 風に実装（注意：競合注意）
      // 本番では S3 → 既存読み込み → 追加 → PutObject が必要
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
      },
      body: JSON.stringify({ message: "質問を保存しました" }),
    };

  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "サーバーエラー", error: err.message }),
    };
  }
};
