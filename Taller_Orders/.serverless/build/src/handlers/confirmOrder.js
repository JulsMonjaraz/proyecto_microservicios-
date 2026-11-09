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

// src/handlers/confirmOrder.ts
var confirmOrder_exports = {};
__export(confirmOrder_exports, {
  confirmOrder: () => confirmOrder
});
module.exports = __toCommonJS(confirmOrder_exports);
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
var forbidden = (message = "Forbidden") => json(403, { message });
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
function withCors(handler2) {
  return async (event) => {
    const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
    const origin = event.headers?.origin ?? event.headers?.Origin ?? "";
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "*";
    const result = await handler2(event);
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

// src/lib/caller.ts
function getCaller(event) {
  const auth = event.requestContext?.authorizer;
  return {
    userId: auth?.userId,
    role: auth?.role
  };
}

// src/handlers/confirmOrder.ts
var ORDERS_TABLE = process.env.ORDERS_TABLE;
async function handler(event) {
  try {
    const { role } = getCaller(event);
    if (role !== "seller") return forbidden("Only sellers can confirm orders");
    const orderId = event.pathParameters?.id;
    if (!orderId) return notFound("Order not found");
    const existing = await dynamo.send(new import_lib_dynamodb2.GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } }));
    if (!existing.Item) return notFound("Order not found");
    if (existing.Item.status !== "pending") {
      return badRequest(`Only pending orders can be confirmed (current status: ${existing.Item.status})`);
    }
    const res = await dynamo.send(
      new import_lib_dynamodb2.UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "confirmed", ":updatedAt": (/* @__PURE__ */ new Date()).toISOString() },
        ReturnValues: "ALL_NEW"
      })
    );
    return ok({ order: res.Attributes });
  } catch (err) {
    console.error("confirmOrder error:", err);
    return internalError();
  }
}
var confirmOrder = withCors(handler);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  confirmOrder
});
//# sourceMappingURL=confirmOrder.js.map
