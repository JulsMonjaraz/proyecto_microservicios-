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

// src/handlers/listOrdersBySeller.ts
var listOrdersBySeller_exports = {};
__export(listOrdersBySeller_exports, {
  listOrdersBySeller: () => listOrdersBySeller
});
module.exports = __toCommonJS(listOrdersBySeller_exports);
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
var productsFn = (name) => `taller-products-${STAGE}-${name}`;

// src/handlers/listOrdersBySeller.ts
var ORDERS_TABLE = process.env.ORDERS_TABLE;
async function sellerOfProduct(productId) {
  try {
    const res = await invokeLambda(productsFn("getProduct"), {
      pathParameters: { id: productId }
    });
    return res.statusCode === 200 ? res.body.product.sellerId : void 0;
  } catch {
    return void 0;
  }
}
async function handler(event) {
  try {
    const { userId, role } = getCaller(event);
    const sellerId = event.pathParameters?.sellerId;
    if (!sellerId) return badRequest("sellerId is required");
    if (role !== "seller" || sellerId !== userId) return forbidden("You can only list your own sales");
    const orders = [];
    let lastKey;
    do {
      const res = await dynamo.send(new import_lib_dynamodb2.ScanCommand({ TableName: ORDERS_TABLE, ExclusiveStartKey: lastKey }));
      orders.push(...res.Items ?? []);
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const sellerById = {};
    await Promise.all(
      productIds.map(async (id) => {
        sellerById[id] = await sellerOfProduct(id);
      })
    );
    const mine = orders.filter((o) => o.items.some((i) => sellerById[i.productId] === sellerId));
    return ok({ orders: mine });
  } catch (err) {
    console.error("listOrdersBySeller error:", err);
    return internalError();
  }
}
var listOrdersBySeller = withCors(handler);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  listOrdersBySeller
});
//# sourceMappingURL=listOrdersBySeller.js.map
