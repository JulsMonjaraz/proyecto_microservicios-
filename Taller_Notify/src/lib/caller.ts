import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Distingue una llamada interna (otro microservicio vía Lambda invoke, sin requestContext)
 * de una llamada HTTP autenticada por el authorizer del gateway.
 */
export function getCaller(event: APIGatewayProxyEvent) {
  const auth = event.requestContext?.authorizer;
  return {
    isInternal: !event.requestContext,
    userId: auth?.userId as string | undefined,
    role: auth?.role as string | undefined,
  };
}
