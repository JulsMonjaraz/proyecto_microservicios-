import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { awsClientConfig } from "./awsConfig";

const STAGE = process.env.STAGE ?? "local";

const lambdaClient = new LambdaClient(awsClientConfig());

interface InvokeResult<T = unknown> {
  statusCode: number;
  body: T;
}

/** Invoca una Lambda de otro servicio con un evento que imita a API Gateway. */
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

  const result = JSON.parse(Buffer.from(res.Payload!).toString()) as {
    statusCode: number;
    body: string;
  };

  return {
    statusCode: result.statusCode,
    body: result.body ? (JSON.parse(result.body) as T) : (null as T),
  };
}

/** Convención del proyecto: {service}-{stage}-{fn} */
export const usersFn = (name: string) => `taller-users-${STAGE}-${name}`;
