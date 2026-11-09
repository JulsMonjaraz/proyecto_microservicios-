import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, forbidden, internalError, notFound, ok } from "../lib/response";
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
    if (existing.Item.sellerId !== userId) return forbidden("You can only edit your own products");

    const body = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return badRequest("name must be a non-empty string");
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string") return badRequest("description must be a string");
      updates.description = body.description;
    }
    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) return badRequest("price must be a number >= 0");
      updates.price = body.price;
    }
    if (body.stock !== undefined) {
      if (typeof body.stock !== "number" || !Number.isInteger(body.stock) || body.stock < 0) {
        return badRequest("stock must be an integer >= 0");
      }
      updates.stock = body.stock;
    }
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

    updates.updatedAt = new Date().toISOString();

    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const sets = Object.keys(updates).map((k) => {
      names[`#${k}`] = k;
      values[`:${k}`] = updates[k];
      return `#${k} = :${k}`;
    });

    const res = await dynamo.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return ok({ product: res.Attributes });
  } catch (err) {
    console.error("updateProduct error:", err);
    return internalError();
  }
}

export const updateProduct = withCors(handler);
