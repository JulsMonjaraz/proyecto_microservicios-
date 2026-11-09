import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

// POST /orders/{id}/confirm: un vendedor confirma una orden pendiente
async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { role } = getCaller(event);
    if (role !== "seller") return forbidden("Only sellers can confirm orders");

    const orderId = event.pathParameters?.id;
    if (!orderId) return notFound("Order not found");

    const existing = await dynamo.send(new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } }));
    if (!existing.Item) return notFound("Order not found");
    if (existing.Item.status !== "pending") {
      return badRequest(`Only pending orders can be confirmed (current status: ${existing.Item.status})`);
    }

    const res = await dynamo.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "confirmed", ":updatedAt": new Date().toISOString() },
        ReturnValues: "ALL_NEW",
      })
    );
    return ok({ order: res.Attributes });
  } catch (err) {
    console.error("confirmOrder error:", err);
    return internalError();
  }
}

export const confirmOrder = withCors(handler);
