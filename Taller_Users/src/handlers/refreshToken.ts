import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, internalError, ok, unauthorized } from "../lib/response";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { withCors } from "../common/cors";

const REFRESH_TOKENS_TABLE = process.env.REFRESH_TOKENS_TABLE!;

async function refreshTokenHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { refreshToken: token } = body;

    if (!token) {
      return badRequest("refreshToken is required");
    }

    // 1. Verificar firma y expiración del token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return unauthorized("Invalid or expired refresh token");
    }

    // 2. Verificar que el token no fue revocado (existe en DB)
    const stored = await dynamo.send(
      new GetCommand({ TableName: REFRESH_TOKENS_TABLE, Key: { token } })
    );

    if (!stored.Item) {
      return unauthorized("Refresh token has been revoked");
    }

    // 3. Rotación de tokens: eliminar el viejo, emitir un par nuevo
    await dynamo.send(new DeleteCommand({ TableName: REFRESH_TOKENS_TABLE, Key: { token } }));

    const newPayload = { userId: payload.userId, email: payload.email, role: payload.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    await dynamo.send(
      new PutCommand({
        TableName: REFRESH_TOKENS_TABLE,
        Item: { token: newRefreshToken, userId: payload.userId, expiresAt },
      })
    );

    return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("refreshToken error:", err);
    return internalError();
  }
}

export const refreshToken = withCors(refreshTokenHandler);
