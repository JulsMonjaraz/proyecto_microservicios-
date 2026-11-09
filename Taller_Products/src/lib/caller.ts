import type { APIGatewayProxyEvent } from "aws-lambda";

/** Datos del usuario que puso el authorizer del Gateway (userId y role del JWT). */
export function getCaller(event: APIGatewayProxyEvent) {
  const auth = event.requestContext?.authorizer;
  return {
    userId: auth?.userId as string | undefined,
    role: auth?.role as string | undefined,
  };
}
