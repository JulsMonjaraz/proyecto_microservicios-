import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { badRequest, internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const sellerId = event.pathParameters?.sellerId;
    if (!sellerId) return badRequest("sellerId is required");

    const res = await dynamo.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: "SellerIndex",
        KeyConditionExpression: "sellerId = :sellerId",
        ExpressionAttributeValues: { ":sellerId": sellerId },
      })
    );
    return ok({ products: res.Items ?? [] });
  } catch (err) {
    console.error("listProductsBySeller error:", err);
    return internalError();
  }
}

export const listProductsBySeller = withCors(handler);
