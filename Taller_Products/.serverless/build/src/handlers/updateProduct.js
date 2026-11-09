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

// src/handlers/updateProduct.ts
var updateProduct_exports = {};
__export(updateProduct_exports, {
  updateProduct: () => updateProduct
});
module.exports = __toCommonJS(updateProduct_exports);
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

// src/handlers/updateProduct.ts
var PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
async function handler(event) {
  try {
    const { userId } = getCaller(event);
    const productId = event.pathParameters?.id;
    if (!productId) return notFound("Product not found");
    const existing = await dynamo.send(new import_lib_dynamodb2.GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
    if (!existing.Item) return notFound("Product not found");
    if (existing.Item.sellerId !== userId) return forbidden("You can only edit your own products");
    const body = JSON.parse(event.body ?? "{}");
    const updates = {};
    if (body.name !== void 0) {
      if (typeof body.name !== "string" || !body.name.trim()) return badRequest("name must be a non-empty string");
      updates.name = body.name.trim();
    }
    if (body.description !== void 0) {
      if (typeof body.description !== "string") return badRequest("description must be a string");
      updates.description = body.description;
    }
    if (body.price !== void 0) {
      if (typeof body.price !== "number" || body.price < 0) return badRequest("price must be a number >= 0");
      updates.price = body.price;
    }
    if (body.stock !== void 0) {
      if (typeof body.stock !== "number" || !Number.isInteger(body.stock) || body.stock < 0) {
        return badRequest("stock must be an integer >= 0");
      }
      updates.stock = body.stock;
    }
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");
    updates.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const names = {};
    const values = {};
    const sets = Object.keys(updates).map((k) => {
      names[`#${k}`] = k;
      values[`:${k}`] = updates[k];
      return `#${k} = :${k}`;
    });
    const res = await dynamo.send(
      new import_lib_dynamodb2.UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW"
      })
    );
    return ok({ product: res.Attributes });
  } catch (err) {
    console.error("updateProduct error:", err);
    return internalError();
  }
}
var updateProduct = withCors(handler);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateProduct
});
//# sourceMappingURL=updateProduct.js.map
