var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/handlers/updateStock.ts
var updateStock_exports = {};
__export(updateStock_exports, {
  updateStock: () => updateStock
});
module.exports = __toCommonJS(updateStock_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// src/lib/dynamodb.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// src/lib/awsConfig.ts
function awsClientConfig() {
  const region = process.env.AWS_REGION ?? "us-east-1";
  if (process.env.STAGE !== "local") return { region };
  const endpoint = process.env.AWS_ENDPOINT_URL ?? (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT ?? "4566"}` : "http://localhost.localstack.cloud:4566");
  return { endpoint, region };
}

// src/lib/dynamodb.ts
var client = new import_client_dynamodb.DynamoDBClient(awsClientConfig());
var dynamo = import_lib_dynamodb.DynamoDBDocumentClient.from(client);

// src/lib/response.ts
var json = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data)
});
var ok = (data) => json(200, data);
var badRequest = (message) => json(400, { message });
var notFound = (message = "Not found") => json(404, { message });
var internalError = (message = "Internal server error") => json(500, { message });

// src/common/cors.ts
var CORS_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Api-Key",
  "X-Amz-Date",
  "X-Amz-Security-Token"
].join(",");
function withCors(handler) {
  return async (event) => {
    const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
    const origin = event.headers?.origin ?? event.headers?.Origin ?? "";
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "*";
    const result = await handler(event);
    return {
      ...result,
      headers: {
        ...result.headers,
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": CORS_HEADERS,
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      }
    };
  };
}

// src/lib/lambdaInvoke.ts
var import_client_lambda = require("@aws-sdk/client-lambda");
var STAGE = process.env.STAGE ?? "local";
var lambdaClient = new import_client_lambda.LambdaClient(awsClientConfig());
async function invokeLambda(functionName, event) {
  const res = await lambdaClient.send(
    new import_client_lambda.InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(event))
    })
  );
  if (res.FunctionError) {
    throw new Error(`Lambda invoke error [${functionName}]: ${res.FunctionError}`);
  }
  const result = JSON.parse(
    Buffer.from(res.Payload).toString()
  );
  return {
    statusCode: result.statusCode,
    body: result.body ? JSON.parse(result.body) : null
  };
}
var notifyFn = (name) => `taller-notify-${STAGE}-${name}`;

// src/handlers/updateStock.ts
var PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
async function updateStockHandler(event) {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return notFound("Product not found");
    }
    const body = JSON.parse(event.body ?? "{}");
    const { quantity } = body;
    if (quantity === void 0 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
      return badRequest("quantity must be a positive integer");
    }
    const existing = await dynamo.send(
      new import_lib_dynamodb2.GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } })
    );
    if (!existing.Item) {
      return notFound("Product not found");
    }
    if (existing.Item.stock < quantity) {
      return badRequest("Insufficient stock");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await dynamo.send(
      new import_lib_dynamodb2.UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
        ConditionExpression: "stock >= :quantity",
        ExpressionAttributeValues: { ":quantity": quantity, ":updatedAt": now }
      })
    );
    if (existing.Item.stock - quantity === 0) {
      try {
        await invokeLambda(notifyFn("alertOutOfStock"), {
          body: JSON.stringify({
            productId,
            productName: existing.Item.name,
            sellerId: existing.Item.sellerId
          })
        });
      } catch (err) {
        console.error("alertOutOfStock failed (stock update kept):", err);
      }
    }
    return ok({ message: "Stock updated successfully" });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return badRequest("Insufficient stock");
    }
    console.error("updateStock error:", err);
    return internalError();
  }
}
var updateStock = withCors(updateStockHandler);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateStock
});
//# sourceMappingURL=updateStock.js.map
