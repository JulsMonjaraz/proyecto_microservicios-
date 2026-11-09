import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId, role } = getCaller(event);
    const orderId = event.pathParameters?.id;
    if (!orderId) return notFound("Order not found");

    const res = await dynamo.send(new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } }));
    if (!res.Item) return notFound("Order not found");

    // Lo ve el comprador dueño de la orden o un vendedor
    if (res.Item.userId !== userId && role !== "seller") return forbidden("Not allowed to view this order");

    return ok({ order: res.Item });
  } catch (err) {
    console.error("getOrder error:", err);
    return internalError();
  }
}

export const getOrder = withCors(handler);
