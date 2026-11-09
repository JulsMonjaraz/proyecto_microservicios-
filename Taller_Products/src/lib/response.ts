import { APIGatewayProxyResult } from "aws-lambda";

const json = (statusCode: number, data: unknown): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(data),
});

export const ok = (data: unknown) => json(200, data);
export const created = (data: unknown) => json(201, data);
export const badRequest = (message: string) => json(400, { message });
export const forbidden = (message = "Forbidden") => json(403, { message });
export const notFound = (message = "Not found") => json(404, { message });
export const internalError = (message = "Internal server error") => json(500, { message });
