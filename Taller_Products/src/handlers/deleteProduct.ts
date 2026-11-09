import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { forbidden, internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId } = getCaller(event);
    const productId = event.pathParameters?.id;
    if (!productId) return notFound("Product not found");

    const existing = await dynamo.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
    if (!existing.Item) return notFound("Product not found");
    if (existing.Item.sellerId !== userId) return forbidden("You can only delete your own products");

    await dynamo.send(new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
    return ok({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return internalError();
  }
}

export const deleteProduct = withCors(handler);
