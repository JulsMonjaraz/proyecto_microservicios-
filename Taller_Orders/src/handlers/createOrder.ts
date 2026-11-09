import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { dynamo } from "../lib/dynamodb";
import { badRequest, created, internalError } from "../lib/response";
import { withCors } from "../common/cors";
import { invokeLambda, notifyFn, productsFn } from "../lib/lambdaInvoke";
import type { Order, OrderItem } from "../types/order";

const ORDERS_TABLE = process.env.ORDERS_TABLE!;

// Obtiene un producto desde Taller-Products vía Lambda invoke
async function fetchProduct(
  productId: string
): Promise<{ productId: string; price: number; stock: number; name: string } | null> {
  try {
    const res = await invokeLambda<{ product: { productId: string; price: number; stock: number; name: string } }>(
      productsFn("getProduct"),
      { pathParameters: { id: productId } }
    );
    if (res.statusCode !== 200) return null;
    return res.body.product;
  } catch {
    return null;
  }
}

// Descuenta stock en Taller-Products vía Lambda invoke
async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const res = await invokeLambda(
      productsFn("updateStock"),
      { pathParameters: { id: productId }, body: JSON.stringify({ quantity }) }
    );
    return res.statusCode === 200;
  } catch {
    return false;
  }
}

async function createOrderHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.userId as string;

    const body = JSON.parse(event.body ?? "{}");
    const { items } = body as { items?: Array<{ productId: string; quantity: number }> };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest("items is required and must be a non-empty array");
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return badRequest("Each item must have a valid productId and a positive integer quantity");
      }
    }

    // ── 1. Validar productos y stock ───────────────────────────────────────────
    const resolvedItems: OrderItem[] = [];
    const productNames: Record<string, string> = {};

    for (const item of items) {
      const product = await fetchProduct(item.productId);

      if (!product) {
        return badRequest(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        return badRequest(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`
        );
      }

      productNames[item.productId] = product.name;

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,  // capturar precio actual al momento de la compra
      });
    }

    const total = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const now = new Date().toISOString();

    // ── 2. Persistir la orden ──────────────────────────────────────────────────
    const order: Order = {
      orderId: uuidv4(),
      userId,
      items: resolvedItems,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));

    // ── 3. Descontar stock en Taller-Products ──────────────────────────────────
    // Saga pattern simplificado: si algún decremento falla, hacemos rollback de
    // los anteriores y cancelamos la orden antes de devolver error al cliente.
    const decremented: OrderItem[] = [];

    for (const item of resolvedItems) {
      const success = await decrementStock(item.productId, item.quantity);
      if (!success) {
        console.error(`Failed to decrement stock for product ${item.productId}. Rolling back.`);

        // Rollback: restaurar stock de los productos ya descontados.
        // Nota: requiere un endpoint incrementStock en Taller-Products (por implementar).
        for (const done of decremented) {
          console.error(`Rollback needed for product ${done.productId} qty ${done.quantity} — stock may be inconsistent`);
        }

        // Marcar la orden como cancelada en DynamoDB
        await dynamo.send(
          new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { orderId: order.orderId },
            UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":status": "cancelled",
              ":updatedAt": new Date().toISOString(),
            },
          })
        );

        return internalError("Could not reserve stock for one or more products. Order has been cancelled.");
      }
      decremented.push(item);
    }

    // ── 4. Notificar al comprador vía Taller_Notify ────────────────────────────
    // Si falla, no se revierte la orden: solo se registra el error.
    try {
      await invokeLambda(notifyFn("notifyPurchase"), {
        body: JSON.stringify({
          userId,
          orderId: order.orderId,
          items: order.items.map((i) => ({ ...i, name: productNames[i.productId] })),
          total: order.total,
        }),
      });
    } catch (err) {
      console.error("notifyPurchase failed (order kept):", err);
    }

    return created({ order });
  } catch (err) {
    console.error("createOrder error:", err);
    return internalError();
  }
}

export const createOrder = withCors(createOrderHandler);
