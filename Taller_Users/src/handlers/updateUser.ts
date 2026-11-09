import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";

const USERS_TABLE = process.env.USERS_TABLE!;

async function updateUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return notFound("User not found");
    }

    // El Authorizer inyecta el payload del JWT en requestContext.authorizer
    const callerId = event.requestContext.authorizer?.userId;
    if (callerId !== userId) {
      return forbidden("You can only update your own profile");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { name } = body;

    if (!name) {
      return badRequest("name is required");
    }

    const existing = await dynamo.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
    );

    if (!existing.Item) {
      return notFound("User not found");
    }

    const now = new Date().toISOString();
    await dynamo.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: "SET #name = :name, updatedAt = :updatedAt",
        // name es palabra reservada en DynamoDB, usamos ExpressionAttributeNames
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: { ":name": name, ":updatedAt": now },
      })
    );

    return ok({ message: "User updated successfully" });
  } catch (err) {
    console.error("updateUser error:", err);
    return internalError();
  }
}

export const updateUser = withCors(updateUserHandler);
