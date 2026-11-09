import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

// POST /orders/{id}/cancel: el comprador dueño (o un vendedor) cancela una orden pendiente
async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId, role } = getCaller(event);
    const orderId = event.pathParameters?.id;
    if (!orderId) return notFound("Order not found");

    const existing = await dynamo.send(new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } }));
    if (!existing.Item) return notFound("Order not found");
    if (existing.Item.userId !== userId && role !== "seller") return forbidden("Not allowed to cancel this order");
    if (existing.Item.status !== "pending") {
      return badRequest(`Only pending orders can be cancelled (current status: ${existing.Item.status})`);
    }

    const res = await dynamo.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "cancelled", ":updatedAt": new Date().toISOString() },
        ReturnValues: "ALL_NEW",
      })
    );
    return ok({ order: res.Attributes });
  } catch (err) {
    console.error("cancelOrder error:", err);
    return internalError();
  }
}

export const cancelOrder = withCors(handler);
