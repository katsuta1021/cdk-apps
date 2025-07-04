import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";
import * as fs from "fs";
import * as path from "path";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler: Handler = async () => {
  const apiUrl = process.env.API_URL!;
  const bucketName = process.env.BUCKET_NAME!;
  const templatePath = path.join(__dirname, "index.template.html");

  const template = fs.readFileSync(templatePath, "utf8");
  const html = template.replace("__API_ENDPOINT__", apiUrl);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: "index.html",
    Body: html,
    ContentType: "text/html",
  });

  await s3.send(command);

  return {
    statusCode: 200,
    body: "HTML uploaded",
  };
};

