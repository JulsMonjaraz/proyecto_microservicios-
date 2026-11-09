import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { invokeLambda, notifyFn } from "../lib/lambdaInvoke";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

// Endpoint interno usado por Taller-Orders para descontar stock al crear una orden.
// Recibe { quantity: number } en el body y resta esa cantidad del stock actual.
async function updateStockHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return notFound("Product not found");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { quantity } = body;

    if (quantity === undefined || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
      return badRequest("quantity must be a positive integer");
    }

    const existing = await dynamo.send(
      new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } })
    );

    if (!existing.Item) {
      return notFound("Product not found");
    }

    if (existing.Item.stock < quantity) {
      return badRequest("Insufficient stock");
    }

    const now = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
        ConditionExpression: "stock >= :quantity",
        ExpressionAttributeValues: { ":quantity": quantity, ":updatedAt": now },
      })
    );

    // Si el stock llegó a 0, avisar al vendedor vía Taller_Notify (no bloquea la respuesta si falla)
    if (existing.Item.stock - quantity === 0) {
      try {
        await invokeLambda(notifyFn("alertOutOfStock"), {
          body: JSON.stringify({
            productId,
            productName: existing.Item.name,
            sellerId: existing.Item.sellerId,
          }),
        });
      } catch (err) {
        console.error("alertOutOfStock failed (stock update kept):", err);
      }
    }

    return ok({ message: "Stock updated successfully" });
  } catch (err: unknown) {
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") {
      return badRequest("Insufficient stock");
    }
    console.error("updateStock error:", err);
    return internalError();
  }
}

export const updateStock = withCors(updateStockHandler);
