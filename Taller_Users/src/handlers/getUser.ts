import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";

const USERS_TABLE = process.env.USERS_TABLE!;

async function getUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return notFound("User not found");
    }

    const result = await dynamo.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
    );

    if (!result.Item) {
      return notFound("User not found");
    }

    // No exponer el password en la respuesta
    const { password: _, ...userPublic } = result.Item;
    return ok({ user: userPublic });
  } catch (err) {
    console.error("getUser error:", err);
    return internalError();
  }
}

export const getUser = withCors(getUserHandler);
