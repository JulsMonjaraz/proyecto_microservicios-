import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function withCors(handler: Handler): Handler {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return async (event: APIGatewayProxyEvent) => {
    const origin = event.headers?.origin ?? event.headers?.Origin ?? "";
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "";

    const response = await handler(event);

    return {
      ...response,
      headers: {
        ...(response.headers ?? {}),
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Api-Key, X-Amz-Date, X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        Vary: "Origin",
      },
    };
  };
}
