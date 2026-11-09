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

// src/handlers/createOrder.ts
var createOrder_exports = {};
__export(createOrder_exports, {
  createOrder: () => createOrder
});
module.exports = __toCommonJS(createOrder_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// node_modules/uuid/dist/esm/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm/rng.js
var import_crypto = require("crypto");
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    (0, import_crypto.randomFillSync)(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm/native.js
var import_crypto2 = require("crypto");
var native_default = { randomUUID: import_crypto2.randomUUID };

// node_modules/uuid/dist/esm/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

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
var created = (data) => json(201, data);
var badRequest = (message) => json(400, { message });
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
var productsFn = (name) => `taller-products-${STAGE}-${name}`;
var notifyFn = (name) => `taller-notify-${STAGE}-${name}`;

// src/handlers/createOrder.ts
var ORDERS_TABLE = process.env.ORDERS_TABLE;
async function fetchProduct(productId) {
  try {
    const res = await invokeLambda(
      productsFn("getProduct"),
      { pathParameters: { id: productId } }
    );
    if (res.statusCode !== 200) return null;
    return res.body.product;
  } catch {
    return null;
  }
}
async function decrementStock(productId, quantity) {
  try {
    const res = await invokeLambda(
      productsFn("updateStock"),
      { pathParameters: { id: productId }, body: JSON.stringify({ quantity }) }
    );
    return res.statusCode === 200;
  } catch {
    return false;
  }
}
async function createOrderHandler(event) {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const body = JSON.parse(event.body ?? "{}");
    const { items } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest("items is required and must be a non-empty array");
    }
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return badRequest("Each item must have a valid productId and a positive integer quantity");
      }
    }
    const resolvedItems = [];
    const productNames = {};
    for (const item of items) {
      const product = await fetchProduct(item.productId);
      if (!product) {
        return badRequest(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        return badRequest(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`
        );
      }
      productNames[item.productId] = product.name;
      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
        // capturar precio actual al momento de la compra
      });
    }
    const total = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const order = {
      orderId: v4_default(),
      userId,
      items: resolvedItems,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    await dynamo.send(new import_lib_dynamodb2.PutCommand({ TableName: ORDERS_TABLE, Item: order }));
    const decremented = [];
    for (const item of resolvedItems) {
      const success = await decrementStock(item.productId, item.quantity);
      if (!success) {
        console.error(`Failed to decrement stock for product ${item.productId}. Rolling back.`);
        for (const done of decremented) {
          console.error(`Rollback needed for product ${done.productId} qty ${done.quantity} \u2014 stock may be inconsistent`);
        }
        await dynamo.send(
          new import_lib_dynamodb2.UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { orderId: order.orderId },
            UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":status": "cancelled",
              ":updatedAt": (/* @__PURE__ */ new Date()).toISOString()
            }
          })
        );
        return internalError("Could not reserve stock for one or more products. Order has been cancelled.");
      }
      decremented.push(item);
    }
    try {
      await invokeLambda(notifyFn("notifyPurchase"), {
        body: JSON.stringify({
          userId,
          orderId: order.orderId,
          items: order.items.map((i) => ({ ...i, name: productNames[i.productId] })),
          total: order.total
        })
      });
    } catch (err) {
      console.error("notifyPurchase failed (order kept):", err);
    }
    return created({ order });
  } catch (err) {
    console.error("createOrder error:", err);
    return internalError();
  }
}
var createOrder = withCors(createOrderHandler);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createOrder
});
//# sourceMappingURL=createOrder.js.map
