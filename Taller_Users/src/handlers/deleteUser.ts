import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";

const USERS_TABLE = process.env.USERS_TABLE!;

async function deleteUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return notFound("User not found");
    }

    // Solo el propio usuario puede borrarse (el authorizer inyecta su userId)
    const callerId = event.requestContext.authorizer?.userId;
    if (callerId !== userId) {
      return forbidden("You can only delete your own account");
    }

    const existing = await dynamo.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
    );

    if (!existing.Item) {
      return notFound("User not found");
    }

    await dynamo.send(new DeleteCommand({ TableName: USERS_TABLE, Key: { userId } }));

    return ok({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return internalError();
  }
}

export const deleteUser = withCors(deleteUserHandler);
