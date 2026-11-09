import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { dynamo } from "../lib/dynamodb";
import { badRequest, created, internalError } from "../lib/response";
import { withCors } from "../common/cors";
import { User } from "../types/user";

const USERS_TABLE = process.env.USERS_TABLE!;

async function registerHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { email, password, name, role = "buyer" } = body;

    if (!email || !password || !name) {
      return badRequest("email, password and name are required");
    }

    if (!["buyer", "seller"].includes(role)) {
      return badRequest("role must be buyer or seller");
    }

    // Verificar si el email ya existe en la tabla (via GSI EmailIndex)
    const existing = await dynamo.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    if (existing.Items && existing.Items.length > 0) {
      return badRequest("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const user: User = {
      userId: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));

    // No retornar el password en la respuesta
    const { password: _, ...userPublic } = user;
    return created({ user: userPublic });
  } catch (err) {
    console.error("register error:", err);
    return internalError();
  }
}

export const register = withCors(registerHandler);
