import type { APIGatewayProxyHandler } from "aws-lambda";

export const ping: APIGatewayProxyHandler = async () => ({
  statusCode: 200,
  headers: { "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify({ message: "pong" }),
});
