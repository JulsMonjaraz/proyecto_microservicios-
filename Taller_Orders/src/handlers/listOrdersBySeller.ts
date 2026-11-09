import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";
import { invokeLambda, productsFn } from "../lib/lambdaInvoke";
import type { Order } from "../types/order";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

async function sellerOfProduct(productId: string): Promise<string | undefined> {
  try {
    const res = await invokeLambda<{ product: { sellerId: string } }>(productsFn("getProduct"), {
      pathParameters: { id: productId },
    });
    return res.statusCode === 200 ? res.body.product.sellerId : undefined;
  } catch {
    return undefined;
  }
}

// GET /orders/seller/{sellerId}: órdenes que incluyen productos del vendedor
async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId, role } = getCaller(event);
    const sellerId = event.pathParameters?.sellerId;
    if (!sellerId) return badRequest("sellerId is required");
    if (role !== "seller" || sellerId !== userId) return forbidden("You can only list your own sales");

    const orders: Order[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await dynamo.send(new ScanCommand({ TableName: ORDERS_TABLE, ExclusiveStartKey: lastKey }));
      orders.push(...((res.Items ?? []) as Order[]));
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);

    const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const sellerById: Record<string, string | undefined> = {};
    await Promise.all(
      productIds.map(async (id) => {
        sellerById[id] = await sellerOfProduct(id);
      })
    );

    const mine = orders.filter((o) => o.items.some((i) => sellerById[i.productId] === sellerId));
    return ok({ orders: mine });
  } catch (err) {
    console.error("listOrdersBySeller error:", err);
    return internalError();
  }
}

export const listOrdersBySeller = withCors(handler);
