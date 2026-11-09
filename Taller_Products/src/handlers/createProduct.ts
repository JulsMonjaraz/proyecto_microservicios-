import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { dynamo } from "../lib/dynamodb";
import { badRequest, created, forbidden, internalError } from "../lib/response";
import { withCors } from "../common/cors";
import { getCaller } from "../lib/caller";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId, role } = getCaller(event);
    if (!userId) return forbidden("Not authenticated");
    if (role !== "seller") return forbidden("Only sellers can create products");

    const body = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
    const { name, description, price, stock } = body;

    if (typeof name !== "string" || !name.trim()) return badRequest("name is required");
    if (typeof price !== "number" || price < 0) return badRequest("price must be a number >= 0");
    if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
      return badRequest("stock must be an integer >= 0");
    }

    const now = new Date().toISOString();
    const product = {
      productId: uuidv4(),
      sellerId: userId,
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      price,
      stock,
      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));
    return created({ product });
  } catch (err) {
    console.error("createProduct error:", err);
    return internalError();
  }
}

export const createProduct = withCors(handler);
