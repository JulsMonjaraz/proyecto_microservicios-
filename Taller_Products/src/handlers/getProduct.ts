import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { internalError, notFound, ok } from "../lib/response";
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

// También lo invoca Taller_Orders por Lambda invoke: devuelve { product }.
async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) return notFound("Product not found");

    const res = await dynamo.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
    if (!res.Item) return notFound("Product not found");

    return ok({ product: res.Item });
  } catch (err) {
    console.error("getProduct error:", err);
    return internalError();
  }
}

export const getProduct = withCors(handler);
