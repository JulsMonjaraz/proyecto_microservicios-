import type {
  APIGatewayTokenAuthorizerHandler,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { verifyAccessToken } from "../lib/jwt";

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: Record<string, string>
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context,
});

// La respuesta del authorizer se cachea (TTL 300s) por token. Si la política solo
// permitiera el methodArn de la primera petición, la siguiente petición con el mismo
// token a OTRO endpoint recibiría 403. Por eso se autoriza todo el API del stage.
const allowAllMethods = (methodArn: string): string => {
  const [apiArn, stage] = methodArn.split("/"); // arn:...:apiId / stage / METHOD / path
  return `${apiArn}/${stage}/*/*`;
};

export const authorizer: APIGatewayTokenAuthorizerHandler = async (event) => {
  const token = event.authorizationToken?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const payload = verifyAccessToken(token);
    return generatePolicy(payload.userId, "Allow", allowAllMethods(event.methodArn), {
      userId: payload.userId,
      role: payload.role,
    });
  } catch {
    throw new Error("Unauthorized");
  }
};
