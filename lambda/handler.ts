import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "投稿成功" }),
    headers: { "Access-Control-Allow-Origin": "*" }
  };
};
