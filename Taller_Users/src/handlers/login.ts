import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { dynamo } from "../lib/dynamodb";
import { badRequest, internalError, ok, unauthorized } from "../lib/response";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";
import { withCors } from "../common/cors";

const USERS_TABLE = process.env.USERS_TABLE!;
const REFRESH_TOKENS_TABLE = process.env.REFRESH_TOKENS_TABLE!;

async function loginHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { email, password } = body;

    if (!email || !password) {
      return badRequest("email and password are required");
    }

    // Buscar usuario por email usando el GSI
    const result = await dynamo.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    const user = result.Items?.[0];

    // Mismo mensaje para email y password incorrectos (evitar enumeración de usuarios)
    if (!user) {
      return unauthorized("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return unauthorized("Invalid credentials");
    }

    const payload = { userId: user.userId, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Guardar refresh token en DynamoDB con TTL de 7 días
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    await dynamo.send(
      new PutCommand({
        TableName: REFRESH_TOKENS_TABLE,
        Item: { token: refreshToken, userId: user.userId, expiresAt },
      })
    );

    return ok({ accessToken, refreshToken });
  } catch (err) {
    console.error("login error:", err);
    return internalError();
  }
}

export const login = withCors(loginHandler);
