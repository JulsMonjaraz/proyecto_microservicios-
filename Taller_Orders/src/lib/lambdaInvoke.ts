import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { awsClientConfig } from "./awsConfig";

const STAGE = process.env.STAGE ?? "local";

const lambdaClient = new LambdaClient(awsClientConfig());

interface InvokeResult<T = unknown> {
  statusCode: number;
  body: T;
}

/**
 * Invoca una función Lambda de otro servicio pasándole un payload que imita
 * el subconjunto de APIGatewayProxyEvent que el handler necesita.
 *
 * @param functionName  Nombre completo de la función (ej. "taller-products-develop-getProduct")
 * @param event         Campos del evento a inyectar (pathParameters, body, etc.)
 */
export async function invokeLambda<T = unknown>(
  functionName: string,
  event: object
): Promise<InvokeResult<T>> {
  const res = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(event)),
    })
  );

  if (res.FunctionError) {
    throw new Error(`Lambda invoke error [${functionName}]: ${res.FunctionError}`);
  }

  const result = JSON.parse(
    Buffer.from(res.Payload!).toString()
  ) as { statusCode: number; body: string };

  return {
    statusCode: result.statusCode,
    body: result.body ? (JSON.parse(result.body) as T) : (null as T),
  };
}

/** Nombre de función según la convención del proyecto: {service}-{stage}-{fn} */
export const productsFn = (name: string) => `taller-products-${STAGE}-${name}`;

/** Nombre de función del microservicio Notify: taller-notify-{stage}-{fn} */
export const notifyFn = (name: string) => `taller-notify-${STAGE}-${name}`;
