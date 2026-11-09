import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "../lib/dynamodb";
import { internalError, ok } from "../lib/response";
import { withCors } from "../common/cors";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;

async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const products: Record<string, unknown>[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await dynamo.send(
        new ScanCommand({ TableName: PRODUCTS_TABLE, ExclusiveStartKey: lastKey })
      );
      products.push(...(res.Items ?? []));
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return ok({ products });
  } catch (err) {
    console.error("listAllProducts error:", err);
    return internalError();
  }
}

export const listAllProducts = withCors(handler);
