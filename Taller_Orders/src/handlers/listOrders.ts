import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

// GET /orders/users/{userId}: órdenes de un comprador (solo las propias)
async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = getCaller(event);
    const target = event.pathParameters?.userId;
    if (!target) return badRequest("userId is required");
    if (target !== userId) return forbidden("You can only list your own orders");

    const res = await dynamo.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: "UserOrdersIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": target },
      })
    );
    return ok({ orders: res.Items ?? [] });
  } catch (err) {
    console.error("listOrders error:", err);
    return internalError();
  }
}

export const listOrders = withCors(handler);
